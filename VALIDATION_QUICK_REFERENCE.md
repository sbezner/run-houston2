# Validation Quick Reference Card

## 🚀 Quick Start

### **Frontend Validation (React/TypeScript)**
```typescript
// Always validate before API calls
const isValid = validateForm();
if (!isValid) return; // Don't submit if validation fails

// Normalize data to ISO format
const normalizedDate = validateDate(userInput.date);
const normalizedTime = validateTime(userInput.start_time);
```

### **Backend Validation (Python/Pydantic)**
```python
# Models automatically validate on creation
try:
    race = RaceCreate(**data)
    # Data is valid and normalized
except ValidationError as e:
    # Return 422 with detailed errors
    raise HTTPException(status_code=422, detail=str(e))
```

## 📋 Required Fields Checklist

| Field | Format | Example | Notes |
|-------|--------|---------|-------|
| `name` | String | "Houston Marathon" | 2-100 chars, trimmed |
| `date` | ISO Date | "2025-01-15" | YYYY-MM-DD only |
| `start_time` | ISO Time | "08:00" or "08:00:00" | HH:MM or HH:MM:SS |
| `city` | String | "Houston" | Non-empty, trimmed |
| `state` | String | "TX" | Non-empty, trimmed |
| `surface` | Enum | "road", "trail", "track", "virtual", "other" | Case-sensitive |
| `distance` | Array | ["5K", "10K"] | Must contain valid distances |

## 🔧 Common Validation Patterns

### **Date Validation**
```typescript
// Frontend: Convert to ISO format
function validateDate(input: string): string | null {
  const date = new Date(input);
  if (isNaN(date.getTime())) return null;
  return date.toISOString().split('T')[0];
}

// Backend: Accepts ISO strings, converts to date objects
date: Union[date, str]  # "2025-01-15" → datetime.date(2025, 1, 15)
```

### **Time Validation**
```typescript
// Frontend: Convert to ISO format
function validateTime(input: string): string | null {
  // Accept HH:MM or HH:MM:SS
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
  return timeRegex.test(input) ? input : null;
}

// Backend: Accepts ISO strings, converts to time objects
start_time: Union[time, str]  # "08:00" → datetime.time(8, 0)
```

### **Surface Validation**
```typescript
// Frontend: Check against valid list
const validSurfaces = ['road', 'trail', 'track', 'virtual', 'other'];
const isValid = validSurfaces.includes(surface.toLowerCase());

// Backend: Same validation + case-sensitive
@validator('surface')
def validate_surface(cls, v):
    if v not in ['road', 'trail', 'track', 'virtual', 'other']:
        raise ValueError('Invalid surface type')
    return v
```

### **Coordinate Validation**
```typescript
// Frontend: Range checking
function validateLatitude(lat: number): boolean {
  return lat >= -90 && lat <= 90;
}

function validateLongitude(lon: number): boolean {
  return lon >= -180 && lon <= 180;
}

// Backend: Same validation
@validator('latitude')
def validate_latitude(cls, v):
    if v is not None and (v < -90 or v > 90):
        raise ValueError('Latitude must be between -90 and 90')
    return v
```

## 🚨 Error Handling

### **Frontend Error Display**
```typescript
const [errors, setErrors] = useState<Record<string, string>>({});

// Display inline errors
{errors.name && <span className="error">{errors.name}</span>}

// Handle API errors
try {
  await createRace(raceData);
} catch (error) {
  if (error.response?.status === 422) {
    // Validation error - display backend errors
    setErrors(parseValidationErrors(error.response.data));
  }
}
```

### **Backend Error Response**
```python
# Pydantic automatically returns 422 for validation errors
@app.post("/races")
def create_race(race_data: RaceCreate):
    # If validation fails, FastAPI returns:
    # Status: 422 Unprocessable Entity
    # Body: Detailed validation errors
    pass
```

## 📊 Valid Values Reference

### **Surface Types**
```python
VALID_SURFACES = [
    'road',      # Paved roads, streets
    'trail',     # Dirt trails, nature paths
    'track',     # Running tracks, stadiums
    'virtual',   # Virtual/online races
    'other'      # Other surfaces
]
```

### **Distance Types**
```python
VALID_DISTANCES = [
    '5K',           # 5 kilometers
    '10K',          # 10 kilometers
    'Half Marathon', # 21.1 kilometers
    'Marathon',     # 42.2 kilometers
    'Ultra',        # > 42.2 kilometers
    'Other'         # Custom distances
]
```

### **Coordinate Ranges**
```python
LATITUDE_RANGE = (-90, 90)      # -90° to +90°
LONGITUDE_RANGE = (-180, 180)   # -180° to +180°
```

## 🧪 Testing Examples

### **Frontend Validation Test**
```typescript
test('validates required fields', () => {
  const errors = validateForm({
    name: '',
    date: '',
    start_time: '',
    city: '',
    state: '',
    surface: '',
    distance: []
  });
  
  expect(errors.name).toBe('Race name is required');
  expect(errors.date).toBe('Date is required');
  // ... other validations
});
```

### **Backend Validation Test**
```python
def test_required_fields():
    with pytest.raises(ValidationError):
        RaceCreate()  # Missing all required fields
    
    # Should work with all required fields
    race = RaceCreate(
        name="Test Race",
        date="2025-01-15",
        start_time="08:00",
        city="Houston",
        state="TX",
        surface="road"
    )
    assert race.name == "Test Race"
```

## ⚡ Performance Tips

1. **Frontend**: Validate on blur/change, not on every keystroke
2. **Backend**: Use Pydantic's built-in validation (very fast)
3. **Database**: Let database constraints be the final safety net
4. **Caching**: Cache validation results for repeated checks

## 🔍 Debugging Validation Issues

### **Common Frontend Issues**
- Date format not ISO (use `validateDate()`)
- Time format not 24-hour (use `validateTime()`)
- Surface not in valid list (check `VALID_SURFACES`)
- Missing required fields (check form state)

### **Common Backend Issues**
- Pydantic validation errors (check model requirements)
- Type conversion failures (ensure ISO format)
- Constraint violations (check ranges, enums)
- Required field missing (check API payload)

### **Debug Commands**
```bash
# Test backend validation directly
python -c "from api.app.models import RaceCreate; RaceCreate(name='Test', date='invalid')"

# Run validation tests
python -m pytest tests/test_frontend_validation.py -v

# Check API validation
curl -X POST /races -H "Content-Type: application/json" -d '{"invalid": "data"}'
```

---

**Need Help?** Check the full [Validation Strategy](./VALIDATION_STRATEGY.md) document.
