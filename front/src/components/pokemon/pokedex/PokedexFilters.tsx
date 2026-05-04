/**
 * PokedexFilters — the filter / sort panel above the Pokemon grid.
 *
 * Pulled out of Pokedex.tsx (which was 656 lines) so the page-level
 * component can focus on data orchestration and layout.
 */

import {
  Box,
  Checkbox,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import React from 'react';

import {
  PixelButton,
  PixelCard,
  PixelSelect,
} from '../../common';
import {
  DIFFICULTY_TIERS,
  type DifficultyKey,
} from '../../../constants';
import { capitalize, formatHyphenated } from '../../../utils';
import { animations } from '../../../styles/animations';

// ----- Styled bits ---------------------------------------------------

const FilterCard = styled(PixelCard)(({ theme }) => ({
  marginBottom: theme.spacing(4),
  animation: `${animations.fadeIn} 0.5s ease-out`,
}));

const FilterTitle = styled(Typography)(({ theme }) => ({
  fontFamily: '"Press Start 2P", monospace',
  fontSize: '0.875rem',
  color: theme.palette.primary.main,
  marginBottom: theme.spacing(2),
}));

const StyledCheckbox = styled(Checkbox)(({ theme }) => ({
  '&.Mui-checked': { color: theme.palette.primary.main },
}));

const CapturedLabel = styled(FormControlLabel)({
  '& .MuiFormControlLabel-label': {
    fontFamily: '"Roboto Mono", monospace',
    fontSize: '0.875rem',
  },
});

const TypeChipBadge = styled(Box)({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  padding: '4px 12px',
  backgroundColor: '#DC0A2D',
  color: '#fff',
  fontFamily: '"Roboto Mono", monospace',
  fontSize: '0.75rem',
  border: '2px solid #000',
});

// ----- Props ---------------------------------------------------------

interface Filters {
  capturedOnly: boolean;
  region: string | null;
  habitat: string | null;
  difficulty: string | null;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface PokedexFiltersProps {
  filters: Filters;
  selectedTypes: string[];
  availableTypes: string[];
  availableRegions: string[];
  availableHabitats: string[];
  totalCount: number;
  visibleCount: number;
  onCapturedChange: (checked: boolean) => void;
  onRegionChange: (region: string) => void;
  onHabitatChange: (habitat: string) => void;
  onDifficultyChange: (difficulty: string) => void;
  onTypeToggle: (type: string) => void;
  onTypeRemove: (type: string) => void;
  onSortByChange: (sortBy: string) => void;
  onSortOrderChange: (order: 'asc' | 'desc') => void;
  onClearFilters: () => void;
}

const MAX_TYPE_FILTERS = 2;

// ----- Component -----------------------------------------------------

const PokedexFilters: React.FC<PokedexFiltersProps> = ({
  filters,
  selectedTypes,
  availableTypes,
  availableRegions,
  availableHabitats,
  totalCount,
  visibleCount,
  onCapturedChange,
  onRegionChange,
  onHabitatChange,
  onDifficultyChange,
  onTypeToggle,
  onTypeRemove,
  onSortByChange,
  onSortOrderChange,
  onClearFilters,
}) => {
  const activeDifficulty = DIFFICULTY_TIERS.find(
    (d) => d.key === filters.difficulty,
  );

  return (
    <FilterCard>
      <FilterTitle>Filters & Sorting</FilterTitle>

      <Box sx={{ mb: 3 }}>
        <CapturedLabel
          control={
            <StyledCheckbox
              checked={filters.capturedOnly}
              onChange={(e) => onCapturedChange(e.target.checked)}
            />
          }
          label="Show only captured Pokémon"
        />
      </Box>

      {/* Region / Habitat / Difficulty selects */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <Box sx={{ flex: '1 1 calc(33.333% - 16px)', minWidth: '200px' }}>
          <PixelSelect>
            <InputLabel>Region</InputLabel>
            <Select
              value={filters.region || ''}
              onChange={(e) => onRegionChange(e.target.value as string)}
              label="Region"
            >
              <MenuItem value=""><em>All Regions</em></MenuItem>
              {availableRegions.map((region) => (
                <MenuItem key={region} value={region}>
                  {capitalize(region)}
                </MenuItem>
              ))}
            </Select>
          </PixelSelect>
        </Box>

        <Box sx={{ flex: '1 1 calc(33.333% - 16px)', minWidth: '200px' }}>
          <PixelSelect>
            <InputLabel>Habitat</InputLabel>
            <Select
              value={filters.habitat || ''}
              onChange={(e) => onHabitatChange(e.target.value as string)}
              label="Habitat"
            >
              <MenuItem value=""><em>All Habitats</em></MenuItem>
              {availableHabitats.map((habitat) => (
                <MenuItem key={habitat} value={habitat}>
                  {formatHyphenated(habitat)}
                </MenuItem>
              ))}
            </Select>
          </PixelSelect>
        </Box>

        <Box sx={{ flex: '1 1 calc(33.333% - 16px)', minWidth: '200px' }}>
          <PixelSelect>
            <InputLabel>Difficulty</InputLabel>
            <Select
              value={filters.difficulty || ''}
              onChange={(e) => onDifficultyChange(e.target.value as string)}
              label="Difficulty"
            >
              <MenuItem value=""><em>All Difficulties</em></MenuItem>
              {DIFFICULTY_TIERS.map((tier) => (
                <MenuItem key={tier.key} value={tier.key}>
                  {tier.label}
                </MenuItem>
              ))}
            </Select>
          </PixelSelect>
        </Box>
      </Box>

      {/* Type filter (max 2) */}
      <Box sx={{ mb: 3 }}>
        <FilterTitle sx={{ fontSize: '0.75rem' }}>
          Filter by Type (Max {MAX_TYPE_FILTERS})
        </FilterTitle>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 2 }}>
          {availableTypes.map((type) => {
            const isSelected = selectedTypes.includes(type);
            const isDisabled = !isSelected && selectedTypes.length >= MAX_TYPE_FILTERS;
            return (
              <PixelButton
                key={type}
                size="small"
                onClick={() => onTypeToggle(type)}
                pixelColor={isSelected ? '#4CAF50' : '#999'}
                disabled={isDisabled}
              >
                {type}
              </PixelButton>
            );
          })}
        </Box>
        {selectedTypes.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
            {selectedTypes.map((type) => (
              <TypeChipBadge key={type}>
                {type}
                <Box
                  component="span"
                  onClick={() => onTypeRemove(type)}
                  sx={{
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    ml: 0.5,
                    '&:hover': { color: '#FF5252' },
                  }}
                >
                  ×
                </Box>
              </TypeChipBadge>
            ))}
          </Box>
        )}
      </Box>

      {/* Sort controls */}
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 2,
          alignItems: 'flex-end',
        }}
      >
        <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 35%' } }}>
          <PixelSelect>
            <InputLabel>Sort By</InputLabel>
            <Select
              value={filters.sortBy}
              onChange={(e) => onSortByChange(e.target.value as string)}
              label="Sort By"
            >
              <MenuItem value="id">ID</MenuItem>
              <MenuItem value="name">Name</MenuItem>
              <MenuItem value="stats_total">Total Stats</MenuItem>
            </Select>
          </PixelSelect>
        </Box>

        <Box sx={{ flex: { xs: '1 1 100%', md: '0 1 35%' } }}>
          <FilterTitle sx={{ fontSize: '0.65rem', mb: 0.5 }}>Order</FilterTitle>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <PixelButton
              size="small"
              onClick={() => onSortOrderChange('asc')}
              pixelColor={filters.sortOrder === 'asc' ? '#4CAF50' : '#999'}
            >
              Asc
            </PixelButton>
            <PixelButton
              size="small"
              onClick={() => onSortOrderChange('desc')}
              pixelColor={filters.sortOrder === 'desc' ? '#4CAF50' : '#999'}
            >
              Desc
            </PixelButton>
          </Box>
        </Box>

        <Box sx={{ flex: { xs: '1 1 100%', md: '0 1 30%' } }}>
          <PixelButton
            fullWidth
            size="small"
            onClick={onClearFilters}
            pixelColor="#FF5252"
          >
            Clear Filters
          </PixelButton>
        </Box>
      </Box>

      {/* Stats line */}
      <Box sx={{ mt: 2, p: 1, backgroundColor: 'rgba(0,0,0,0.05)' }}>
        <Typography
          sx={{
            fontFamily: '"Roboto Mono", monospace',
            fontSize: '0.75rem',
            textAlign: 'center',
          }}
        >
          Showing {visibleCount} of {totalCount} Pokémon
          {filters.capturedOnly && ' (Captured only)'}
          {filters.region && ` • ${capitalize(filters.region)}`}
          {filters.habitat && ` • ${formatHyphenated(filters.habitat)}`}
          {activeDifficulty && ` • ${activeDifficulty.label}`}
        </Typography>
      </Box>
    </FilterCard>
  );
};

export default PokedexFilters;
// Re-exported here purely to silence "unused type import" if a caller wants it.
export type { DifficultyKey };
