# Validation Strategy & Architecture

## Overview

This document outlines the validation strategy for the Run Houston application, explaining how data validation is distributed between frontend and backend components, and the responsibilities of each layer.

## 🏗️ Architecture Principles

### **Separation of Concerns**
- **Frontend**: User experience validation, data normalization, immediate feedback
- **Backend**: Data integrity, business rules, security validation
- **Database**: Referential integrity, constraints

### **Validation Boundaries**
- **Client-Side**: UX-focused validation for immediate user feedback
- **Server-Side**: Security and data integrity validation
- **Database**: Final constraint enforcement

## 📋 Validation Responsibilities

### **Frontend Validation (`web/src/`)**

#### **RaceForm.tsx - User Input Validation**
```typescript
// Immediate form validation for user experience
const validateForm = () => {
  const newErrors: Record<string, string> = {};
  
  // Required field validation
  if (!formData.name.trim()) newErrors.name = 'Race name is required';
  if (!formData.date) newErrors.date = 'Date is required';
  if (!formData.start_time) newErrors.start_time = 'Start time is required';
  if (!formData.city?.trim()) newErrors.city = 'City is required';
  if (!formData.state?.trim()) newErrors.state = 'State is required';
  if (!formData.surface) newErrors.surface = 'Surface type is required';
  if (!formData.distance || formData.distance.length === 0) {
    newErrors.distance = 'At least one distance is required';
  }
  
  // Range validation
  if (formData.latitude !== null && (formData.latitude < -90 || formData.latitude > 90)) {
    newErrors.latitude = 'Latitude must be between -90 and 90';
  }
  if (formData.longitude !== null && (formData.longitude < -180 || formData.longitude > 180)) {
    newErrors.longitude = 'Longitude must be between -180 and 180';
  }
  
  return Object.keys(newErrors).length === 0;
};
```

**Purpose**: Provide immediate feedback to users before form submission.

#### **CSV Import Validation (`web/src/pages/AdminDashboard/ImportCsv/validation.ts`)**
```typescript
// Data normalization and validation for bulk imports
export function validateDate(dateStr: string): string | null {
  // Convert various date formats to ISO
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return null;
  return date.toISOString().split('T')[0]; // YYYY-MM-DD
}

export function validateSurface(surface: string): string | null {
  const validSurfaces = ['road', 'trail', 'track', 'virtual', 'other'];
  return validSurfaces.includes(surface.toLowerCase()) ? surface.toLowerCase() : null;
}

export function validateBackendCompatibility(normalized: NormalizedRow): ImportError[] {
  // Ensure data meets backend requirements before API calls
}
```

**Purpose**: Normalize data from various sources to meet backend requirements.

### **Backend Validation (`api/app/models.py`)**

#### **Pydantic Model Validation**
```python
class RaceCreate(BaseModel):
    name: str
    date: Union[date, str]
    start_time: Union[time, str]  # Required
    city: str                      # Required
    state: str                     # Required
    surface: str                   # Required
    distance: list[str] = ['5K']   # Required
    # ... other fields

    @validator('name')
    def validate_name(cls, v):
        if not v or len(v.strip()) < 2:
            raise ValueError('Name must be at least 2 characters')
        if len(v) > 100:
            raise ValueError('Name must be less than 100 characters')
        return v.strip()

    @validator('date')
    def validate_date(cls, v):
        if isinstance(v, str):
            try:
                return date.fromisoformat(v)  # Only ISO format accepted
            except ValueError:
                raise ValueError('Date must be in ISO format (YYYY-MM-DD)')
        return v

    @validator('surface')
    def validate_surface(cls, v):
        valid_surfaces = ['road', 'trail', 'track', 'virtual', 'other']
        if v not in valid_surfaces:
            raise ValueError(f'Surface must be one of: {", ".join(valid_surfaces)}')
        return v

    @validator('latitude')
    def validate_latitude(cls, v):
        if v is not None and (v < -90 or v > 90):
            raise ValueError('Latitude must be between -90 and 90')
        return v
```

**Purpose**: Enforce data integrity, business rules, and security constraints.

## 🔄 Data Flow & Validation Pipeline

### **1. User Input → Frontend Validation**
```
User types "8/19/2025" → Frontend validates → Shows error or normalizes
```

### **2. Frontend → Backend Submission**
```
Normalized data → API call → Pydantic validation → Database insertion
```

### **3. Validation Failure Handling**
```
Backend validation fails → Returns 422 Unprocessable Entity → Frontend displays error
```

## 📊 Field-by-Field Validation Rules

### **Required Fields**
| Field | Frontend | Backend | Validation Rules |
|-------|----------|---------|------------------|
| `name` | ✅ Required | ✅ Required | 2-100 characters, trimmed |
| `date` | ✅ Required | ✅ Required | ISO format (YYYY-MM-DD) only |
| `start_time` | ✅ Required | ✅ Required | ISO format (HH:MM or HH:MM:SS) |
| `city` | ✅ Required | ✅ Required | Non-empty string, trimmed |
| `state` | ✅ Required | ✅ Required | Non-empty string, trimmed |
| `surface` | ✅ Required | ✅ Required | Must be: road, trail, track, virtual, other |
| `distance` | ✅ Required | ✅ Required | Non-empty list, valid values only |

### **Optional Fields**
| Field | Frontend | Backend | Validation Rules |
|-------|----------|---------|------------------|
| `address` | Optional | Optional | Any string |
| `zip` | Optional | Optional | Any string |
| `latitude` | Range check | Range check | -90 ≤ lat ≤ 90 |
| `longitude` | Range check | Range check | -180 ≤ lon ≤ 180 |
| `kid_run` | Optional | Optional | Boolean |
| `official_website_url` | Optional | Optional | Valid HTTP URL or string |

## 🚨 Error Handling Strategy

### **Frontend Error Display**
```typescript
// Immediate feedback for user experience
const [errors, setErrors] = useState<Record<string, string>>({});

// Display errors inline with form fields
{errors.name && <span className="error">{errors.name}</span>}
```

### **Backend Error Response**
```python
# Pydantic automatically returns detailed validation errors
@app.post("/races")
def create_race(race_data: RaceCreate):
    # If validation fails, FastAPI returns 422 with detailed errors
    pass
```

### **API Error Format**
```json
{
  "detail": [
    {
      "loc": ["body", "date"],
      "msg": "Date must be in ISO format (YYYY-MM-DD)",
      "type": "value_error"
    },
    {
      "loc": ["body", "surface"],
      "msg": "Surface must be one of: road, trail, track, virtual, other",
      "type": "value_error"
    }
  ]
}
```

## 🔧 Configuration & Customization

### **Valid Surface Types**
```python
VALID_SURFACES = ['road', 'trail', 'track', 'virtual', 'other']
```

### **Valid Distance Types**
```python
VALID_DISTANCES = ['5K', '10K', 'Half Marathon', 'Marathon', 'Ultra', 'Other']
```

### **Coordinate Constraints**
```python
LATITUDE_RANGE = (-90, 90)
LONGITUDE_RANGE = (-180, 180)
```

## 🧪 Testing Strategy

### **Frontend Validation Tests**
- Form field validation
- Error message display
- User experience flow

### **Backend Validation Tests**
- Pydantic model validation
- Required field enforcement
- Data type conversion
- Constraint validation

### **Integration Tests**
- Frontend → Backend data flow
- Error handling across layers
- Data consistency

## 📝 Best Practices

### **For Frontend Developers**
1. **Always validate user input** before submission
2. **Normalize data** to match backend expectations
3. **Provide immediate feedback** for validation errors
4. **Handle backend errors gracefully**

### **For Backend Developers**
1. **Never trust client data** - always validate
2. **Use Pydantic models** for automatic validation
3. **Provide clear error messages** for debugging
4. **Log validation failures** for monitoring

### **For Database Administrators**
1. **Enforce referential integrity** at database level
2. **Use appropriate constraints** for data types
3. **Monitor constraint violations** for data quality

## 🔮 Future Enhancements

### **Planned Improvements**
1. **Real-time validation** using WebSockets
2. **Custom validation rules** for business logic
3. **Validation rule configuration** via admin panel
4. **Data quality metrics** and reporting

### **Migration Considerations**
1. **Pydantic V2 migration** for better performance
2. **Async validation** for improved scalability
3. **Validation caching** for repeated checks

## 📚 Related Documentation

- [API Models](./api/app/models.py) - Backend validation rules
- [Frontend Components](./web/src/components/) - User interface validation
- [CSV Import](./web/src/pages/AdminDashboard/ImportCsv/) - Bulk data validation
- [Test Suite](./tests/) - Validation testing

---

**Last Updated**: December 2024  
**Version**: 1.0  
**Maintainer**: Development Team
