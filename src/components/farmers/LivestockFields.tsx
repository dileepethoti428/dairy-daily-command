import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';
import type { LivestockInput } from '@/hooks/useFarmerLivestock';

const COW_BREEDS = [
  { value: 'gir', label: 'Gir' },
  { value: 'other', label: 'Other' },
];

const BUFFALO_BREEDS = [
  { value: 'murrah', label: 'Murrah' },
  { value: 'jafarabadi', label: 'Jafarabadi' },
  { value: 'surti', label: 'Surti' },
  { value: 'mehsani', label: 'Mehsani' },
  { value: 'other', label: 'Other' },
];

interface LivestockFieldsProps {
  milkType: 'cow' | 'buffalo' | 'both';
  livestock: LivestockInput[];
  onChange: (livestock: LivestockInput[]) => void;
}

function AnimalSection({
  animalType,
  data,
  onChange,
}: {
  animalType: 'cow' | 'buffalo';
  data: LivestockInput;
  onChange: (data: LivestockInput) => void;
}) {
  const breeds = animalType === 'cow' ? COW_BREEDS : BUFFALO_BREEDS;
  const label = animalType === 'cow' ? 'Cow' : 'Buffalo';
  const knownBreedValues = breeds.map((b) => b.value);
  const isOther = data.breed === 'other' || (data.breed && !knownBreedValues.includes(data.breed));
  const selectValue = isOther ? 'other' : data.breed;

  return (
    <div className="space-y-3">
      <Badge variant="outline" className="capitalize">
        {label}
      </Badge>

      <div className="space-y-2">
        <Label>Breed *</Label>
        <Select
          value={selectValue}
          onValueChange={(value) => {
            if (value === 'other') {
              onChange({ ...data, breed: 'other' });
            } else {
              onChange({ ...data, breed: value });
            }
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select breed" />
          </SelectTrigger>
          <SelectContent>
            {breeds.map((b) => (
              <SelectItem key={b.value} value={b.value}>
                {b.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {isOther && (
          <Input
            placeholder="Enter breed name"
            value={data.breed === 'other' ? '' : data.breed}
            onChange={(e) => onChange({ ...data, breed: e.target.value || 'other' })}
          />
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Number of Animals *</Label>
          <Input
            type="number"
            inputMode="numeric"
            min={1}
            value={data.animal_count || ''}
            onChange={(e) =>
              onChange({ ...data, animal_count: parseInt(e.target.value) || 0 })
            }
            placeholder="0"
          />
        </div>
        <div className="space-y-2">
          <Label>Expected Daily Milk (L) *</Label>
          <Input
            type="number"
            inputMode="decimal"
            step="0.5"
            min={0}
            value={data.expected_daily_liters || ''}
            onChange={(e) =>
              onChange({
                ...data,
                expected_daily_liters: parseFloat(e.target.value) || 0,
              })
            }
            placeholder="0.0"
          />
        </div>
      </div>
    </div>
  );
}

export function LivestockFields({ milkType, livestock, onChange }: LivestockFieldsProps) {
  const getDefault = (type: 'cow' | 'buffalo'): LivestockInput => ({
    animal_type: type,
    breed: type === 'cow' ? 'gir' : '',
    animal_count: 0,
    expected_daily_liters: 0,
  });

  const getCow = () => livestock.find((l) => l.animal_type === 'cow') || getDefault('cow');
  const getBuffalo = () => livestock.find((l) => l.animal_type === 'buffalo') || getDefault('buffalo');

  const handleChange = (type: 'cow' | 'buffalo', data: LivestockInput) => {
    const other = livestock.filter((l) => l.animal_type !== type);
    onChange([...other, { ...data, animal_type: type }]);
  };

  return (
    <Card className="shadow-dairy">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          🐄 Livestock Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Warning banner */}
        <div className="flex items-center gap-2 rounded-md bg-warning/10 px-3 py-2 text-xs text-warning">
          <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
          <span>We only accept <strong>Gir cow</strong> and <strong>Buffalo</strong> milk. Please ensure breed information is accurate.</span>
        </div>

        {(milkType === 'cow' || milkType === 'both') && (
          <AnimalSection
            animalType="cow"
            data={getCow()}
            onChange={(d) => handleChange('cow', d)}
          />
        )}

        {milkType === 'both' && <hr className="border-border" />}

        {(milkType === 'buffalo' || milkType === 'both') && (
          <AnimalSection
            animalType="buffalo"
            data={getBuffalo()}
            onChange={(d) => handleChange('buffalo', d)}
          />
        )}
      </CardContent>
    </Card>
  );
}
