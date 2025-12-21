#!/usr/bin/env python3
"""
Script to populate Supabase database with Pokemon data from PokeAPI
This only needs to be run once to populate the database
UPDATED: Now includes Pokemon descriptions from species endpoint
"""

import asyncio
import httpx
import json
from typing import List, Dict, Any, Optional
from app.database import supabase

POKEAPI_BASE_URL = "https://pokeapi.co/api/v2"
BATCH_SIZE = 50  # Process 50 Pokemon at a time
MAX_POKEMON = 1025  # Current total Pokemon in PokeAPI (as of Gen 9)

async def fetch_pokemon_list(client: httpx.AsyncClient, limit: int, offset: int) -> List[Dict]:
    """Fetch a list of Pokemon from PokeAPI"""
    url = f"{POKEAPI_BASE_URL}/pokemon?limit={limit}&offset={offset}"
    response = await client.get(url)
    response.raise_for_status()
    data = response.json()
    return data['results']

async def fetch_pokemon_detail(client: httpx.AsyncClient, url: str) -> Dict[str, Any]:
    """Fetch detailed Pokemon data from PokeAPI"""
    response = await client.get(url)
    response.raise_for_status()
    return response.json()

async def fetch_pokemon_species(client: httpx.AsyncClient, pokemon_id: int) -> Optional[str]:
    """Fetch Pokemon species data to get the Pokedex description"""
    try:
        url = f"{POKEAPI_BASE_URL}/pokemon-species/{pokemon_id}/"
        response = await client.get(url)
        response.raise_for_status()
        data = response.json()
        
        # Get English flavor text entries
        flavor_texts = data.get('flavor_text_entries', [])
        
        # Find the first English entry (preferably from a recent game)
        for entry in flavor_texts:
            if entry['language']['name'] == 'en':
                # Clean up the text (remove form feeds and extra spaces)
                description = entry['flavor_text'].replace('\f', ' ').replace('\n', ' ')
                description = ' '.join(description.split())  # Normalize whitespace
                return description
        
        return None
    except Exception as e:
        print(f"  ⚠️  Could not fetch description for Pokemon {pokemon_id}: {e}")
        return None

def extract_pokemon_data(pokemon_data: Dict[str, Any], description: Optional[str] = None) -> Dict[str, Any]:
    """Extract and format Pokemon data for database insertion"""
    # Extract stats
    stats = {stat['stat']['name']: stat['base_stat'] for stat in pokemon_data['stats']}
    stats_total = sum(stats.values())
    
    # Extract types
    types = [t['type']['name'] for t in pokemon_data['types']]
    
    # Extract abilities
    abilities = [
        {
            'name': ability['ability']['name'],
            'is_hidden': ability['is_hidden']
        }
        for ability in pokemon_data['abilities']
    ]
    
    # Get best sprites
    sprites = pokemon_data['sprites']
    sprite_default = sprites.get('front_default')
    sprite_official = None
    if sprites.get('other'):
        official_artwork = sprites['other'].get('official-artwork', {})
        sprite_official = official_artwork.get('front_default')
    
    return {
        'id': pokemon_data['id'],
        'name': pokemon_data['name'],
        'height': pokemon_data['height'],
        'weight': pokemon_data['weight'],
        'base_experience': pokemon_data.get('base_experience'),
        'sprite_default': sprite_default,
        'sprite_official': sprite_official,
        'stats_hp': stats.get('hp', 0),
        'stats_attack': stats.get('attack', 0),
        'stats_defense': stats.get('defense', 0),
        'stats_special_attack': stats.get('special-attack', 0),
        'stats_special_defense': stats.get('special-defense', 0),
        'stats_speed': stats.get('speed', 0),
        'stats_total': stats_total,
        'types': types,
        'abilities': json.dumps(abilities),
        'sprites': json.dumps(sprites),
        'description': description,  # NEW: Add description
    }

async def process_batch(client: httpx.AsyncClient, pokemon_list: List[Dict]) -> List[Dict[str, Any]]:
    """Process a batch of Pokemon concurrently"""
    tasks = []
    for pokemon in pokemon_list:
        tasks.append(fetch_pokemon_detail(client, pokemon['url']))
    
    pokemon_details = await asyncio.gather(*tasks, return_exceptions=True)
    
    processed = []
    for i, pokemon_data in enumerate(pokemon_details):
        if isinstance(pokemon_data, Exception):
            print(f"  ⚠️  Error fetching Pokemon: {pokemon_data}")
            continue
        try:
            # Fetch the description from species endpoint
            pokemon_id = pokemon_data['id']
            description = await fetch_pokemon_species(client, pokemon_id)
            
            # Extract and add to processed list
            processed.append(extract_pokemon_data(pokemon_data, description))
        except Exception as e:
            print(f"  ⚠️  Error processing Pokemon {pokemon_data.get('name', 'unknown')}: {e}")
    
    return processed

def insert_pokemon_batch(pokemon_batch: List[Dict[str, Any]]) -> int:
    """Insert a batch of Pokemon into Supabase"""
    if not pokemon_batch:
        return 0
    
    try:
        response = supabase.table("pokemon").upsert(pokemon_batch).execute()
        return len(pokemon_batch)
    except Exception as e:
        print(f"  ⚠️  Error inserting batch: {e}")
        # Try inserting one by one if batch fails
        success_count = 0
        for pokemon in pokemon_batch:
            try:
                supabase.table("pokemon").upsert(pokemon).execute()
                success_count += 1
            except Exception as e2:
                print(f"    ⚠️  Error inserting {pokemon['name']}: {e2}")
        return success_count

async def populate_database():
    """Main function to populate the database"""
    print(f"Starting to fetch and populate {MAX_POKEMON} Pokemon...")
    print(f"This may take several minutes...\n")
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        total_inserted = 0
        offset = 0
        
        while offset < MAX_POKEMON:
            # Fetch Pokemon list (PokeAPI returns max 100 at a time)
            limit = min(100, MAX_POKEMON - offset)
            print(f"Fetching Pokemon {offset + 1} to {offset + limit}...")
            
            try:
                pokemon_list = await fetch_pokemon_list(client, limit, offset)
            except Exception as e:
                print(f"  ❌ Error fetching Pokemon list: {e}")
                break
            
            # Process in smaller batches
            for i in range(0, len(pokemon_list), BATCH_SIZE):
                batch = pokemon_list[i:i + BATCH_SIZE]
                batch_num = (offset + i) // BATCH_SIZE + 1
                
                print(f"  Processing batch {batch_num} ({len(batch)} Pokemon)...")
                
                # Fetch and process Pokemon details
                processed = await process_batch(client, batch)
                
                # Insert into database
                inserted = insert_pokemon_batch(processed)
                total_inserted += inserted
                
                print(f"  ✓ Inserted {inserted}/{len(batch)} Pokemon (Total: {total_inserted})")
                
                # Small delay to be nice to PokeAPI
                await asyncio.sleep(0.5)
            
            offset += limit
    
    print(f"\n{'='*60}")
    print(f"✓ Database population complete!")
    print(f"  Total Pokemon inserted: {total_inserted}")
    print(f"{'='*60}")
    
    # Verify the count
    try:
        count_response = supabase.table("pokemon").select("id", count="exact").execute()
        db_count = count_response.count
        print(f"\n✓ Verification: {db_count} Pokemon in database")
    except Exception as e:
        print(f"\n⚠️  Couldn't verify count: {e}")

if __name__ == "__main__":
    print("="*60)
    print("Pokemon Database Population Script")
    print("="*60)
    print("\nThis script will:")
    print("1. Fetch all Pokemon from PokeAPI")
    print("2. Fetch Pokedex descriptions from species endpoint")
    print("3. Store them in your Supabase database")
    print("4. This only needs to be run once")
    print("\nMake sure you have:")
    print("- Created the 'pokemon' table using schema_pokemon.sql")
    print("- Set up your .env file with Supabase credentials")
    print("="*60)
    
    input("\nPress Enter to continue or Ctrl+C to cancel...")
    
    try:
        asyncio.run(populate_database())
    except KeyboardInterrupt:
        print("\n\n✗ Script cancelled by user")
    except Exception as e:
        print(f"\n\n✗ Error: {e}")