#!/usr/bin/env python3
"""
Script to populate Pokemon region and habitat data from PokeAPI species endpoint
Run this after adding region/habitat columns to the database
"""

import asyncio
import httpx
from typing import Dict, Any, Optional
import sys
import os

# Add parent directory to path to import app modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.database import supabase

POKEAPI_BASE_URL = "https://pokeapi.co/api/v2"
BATCH_SIZE = 20  # Process 20 Pokemon at a time
MAX_POKEMON = 1025

async def fetch_pokemon_species(client: httpx.AsyncClient, pokemon_id: int) -> Optional[Dict[str, Any]]:
    """Fetch Pokemon species data to get region and habitat"""
    try:
        url = f"{POKEAPI_BASE_URL}/pokemon-species/{pokemon_id}/"
        response = await client.get(url)
        response.raise_for_status()
        data = response.json()
        
        # Extract region from generation
        generation = data.get('generation', {}).get('name', '')
        region = map_generation_to_region(generation)
        
        # Extract habitat
        habitat_data = data.get('habitat')
        habitat = habitat_data['name'] if habitat_data else None
        
        return {
            'id': pokemon_id,
            'region': region,
            'habitat': habitat
        }
        
    except Exception as e:
        print(f"  ⚠️  Error fetching species data for Pokemon {pokemon_id}: {e}")
        return None

def map_generation_to_region(generation: str) -> Optional[str]:
    """Map Pokemon generation to region"""
    generation_map = {
        'generation-i': 'kanto',
        'generation-ii': 'johto',
        'generation-iii': 'hoenn',
        'generation-iv': 'sinnoh',
        'generation-v': 'unova',
        'generation-vi': 'kalos',
        'generation-vii': 'alola',
        'generation-viii': 'galar',
        'generation-ix': 'paldea'
    }
    return generation_map.get(generation)

async def process_batch(client: httpx.AsyncClient, start_id: int, end_id: int) -> list:
    """Process a batch of Pokemon concurrently"""
    tasks = []
    for pokemon_id in range(start_id, end_id + 1):
        tasks.append(fetch_pokemon_species(client, pokemon_id))
    
    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    # Filter out None and exceptions
    valid_results = []
    for result in results:
        if isinstance(result, dict) and result:
            valid_results.append(result)
    
    return valid_results

def update_pokemon_batch(pokemon_batch: list) -> int:
    """Update Pokemon in database with region/habitat data"""
    if not pokemon_batch:
        return 0
    
    success_count = 0
    for pokemon in pokemon_batch:
        try:
            supabase.table("pokemon").update({
                'region': pokemon['region'],
                'habitat': pokemon['habitat']
            }).eq('id', pokemon['id']).execute()
            success_count += 1
        except Exception as e:
            print(f"  ⚠️  Error updating Pokemon {pokemon['id']}: {e}")
    
    return success_count

async def populate_region_habitat():
    """Main function to populate region and habitat data"""
    print(f"Starting to populate region/habitat for {MAX_POKEMON} Pokemon...")
    print(f"This may take several minutes...\n")
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        total_updated = 0
        
        for start_id in range(1, MAX_POKEMON + 1, BATCH_SIZE):
            end_id = min(start_id + BATCH_SIZE - 1, MAX_POKEMON)
            batch_num = (start_id - 1) // BATCH_SIZE + 1
            
            print(f"Processing batch {batch_num} (Pokemon {start_id}-{end_id})...")
            
            # Fetch species data
            processed = await process_batch(client, start_id, end_id)
            
            # Update database
            updated = update_pokemon_batch(processed)
            total_updated += updated
            
            print(f"  ✓ Updated {updated}/{len(processed)} Pokemon (Total: {total_updated})")
            
            # Small delay to be nice to PokeAPI
            await asyncio.sleep(0.5)
    
    print(f"\n{'='*60}")
    print(f"✓ Region/Habitat population complete!")
    print(f"  Total Pokemon updated: {total_updated}")
    print(f"{'='*60}")
    
    # Verify the data
    try:
        response = supabase.table("pokemon").select("region, habitat", count="exact").not_.is_("region", "null").execute()
        print(f"\n✓ Verification: {response.count} Pokemon have region data")
    except Exception as e:
        print(f"\n⚠️  Couldn't verify count: {e}")

if __name__ == "__main__":
    print("="*60)
    print("Pokemon Region/Habitat Population Script")
    print("="*60)
    print("\nThis script will:")
    print("1. Fetch species data from PokeAPI for all Pokemon")
    print("2. Extract region (from generation) and habitat")
    print("3. Update your Supabase database")
    print("\nMake sure you have:")
    print("- Run the add_region_habitat.sql migration")
    print("- Set up your .env file with Supabase credentials")
    print("="*60)
    
    input("\nPress Enter to continue or Ctrl+C to cancel...")
    
    try:
        asyncio.run(populate_region_habitat())
    except KeyboardInterrupt:
        print("\n\n✗ Script cancelled by user")
    except Exception as e:
        print(f"\n\n✗ Error: {e}")