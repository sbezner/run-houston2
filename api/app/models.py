from pydantic import BaseModel, HttpUrl, field_validator, model_validator
from typing import Optional, Union
from datetime import date, time, datetime

from .validation_cache import cached_validation

class AdminLogin(BaseModel):
    username: str
    password: str

class AdminLoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    username: str

class RaceCreate(BaseModel):
    id: Optional[int] = None  # Add optional ID for upserts
    name: str
    date: Union[date, str]
    start_time: Union[time, str]  # Required to match frontend
    address: Optional[str] = None
    city: str  # Required to match frontend
    state: str  # Required to match frontend
    zip: Optional[str] = None
    surface: str  # Required to match frontend
    distance: Union[list[str], str] = ['5K']  # Required to match frontend
    kid_run: bool = False
    official_website_url: Optional[Union[HttpUrl, str]] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    source: Optional[str] = None

    @field_validator('name')
    @classmethod
    @cached_validation
    def validate_name(cls, v: str) -> str:
        if not v or len(v.strip()) < 2:
            raise ValueError('Name must be at least 2 characters')
        if len(v) > 100:
            raise ValueError('Name must be less than 100 characters')
        
        return v.strip()

    @field_validator('date')
    @classmethod
    @cached_validation
    def validate_date(cls, v: Union[date, str]) -> date:
        if isinstance(v, date):
            return v
        
        if isinstance(v, str):
            # Try multiple date formats
            date_formats = [
                '%m/%d/%Y',      # 8/19/2025
                '%m-%d-%Y',      # 8-19-2025
                '%Y-%m-%d',      # 2025-08-19 (ISO)
                '%m/%d/%y',      # 8/19/25
                '%B %d, %Y',     # August 19, 2025
            ]
            
            for fmt in date_formats:
                try:
                    return datetime.strptime(v, fmt).date()
                except ValueError:
                    continue
            
            # If all formats fail, raise clear error
            raise ValueError(f'Date "{v}" not recognized. Supported formats: MM/DD/YYYY, YYYY-MM-DD, MM/DD/YY, Month DD, YYYY')
        
        raise ValueError('Date must be string or date object')

    @field_validator('start_time')
    @classmethod
    @cached_validation
    def validate_start_time(cls, v: Union[time, str]) -> time:
        if isinstance(v, time):
            return v
            
        if isinstance(v, str):
            try:
                return time.fromisoformat(v)
            except ValueError:
                raise ValueError('Start time must be in ISO format (HH:MM or HH:MM:SS)')
        
        raise ValueError('Start time must be string or time object')

    @field_validator('city')
    @classmethod
    @cached_validation
    def validate_city(cls, v: str) -> str:
        if not v or len(v.strip()) < 1:
            raise ValueError('City is required')
        return v.strip()

    @field_validator('state')
    @classmethod
    @cached_validation
    def validate_state(cls, v: str) -> str:
        if not v or len(v.strip()) < 1:
            raise ValueError('State is required')
        return v.strip()

    @field_validator('surface')
    @classmethod
    @cached_validation
    def validate_surface(cls, v: str) -> str:
        valid_surfaces = ['road', 'trail', 'track', 'virtual', 'other']
        if not v or v not in valid_surfaces:
            raise ValueError(f'Surface must be one of: {", ".join(valid_surfaces)}')
        return v

    @field_validator('distance')
    @classmethod
    @cached_validation
    def validate_distance(cls, v: Union[list[str], str]) -> list[str]:
        if isinstance(v, str):
            # Handle CSV input like "5K, Half, U" or "5K"
            if ',' in v:
                # Split by comma and clean up
                distances = [d.strip() for d in v.split(',') if d.strip()]
            else:
                # Single distance
                distances = [v.strip()]
            
            # Map abbreviated forms to full names
            distance_mapping = {
                '5K': '5K',
                '10K': '10K',
                'Half': 'Half Marathon',
                'H': 'Half Marathon',
                'Marathon': 'Marathon',
                'M': 'Marathon',
                'Ultra': 'Ultra',
                'U': 'Ultra',
                'Other': 'Other',
                'O': 'Other'
            }
            
            # Convert abbreviated forms to full names
            normalized_distances = []
            for distance in distances:
                normalized = distance_mapping.get(distance, distance)
                normalized_distances.append(normalized)
            
            # Validate each distance
            valid_distances = ['5K', '10K', 'Half Marathon', 'Marathon', 'Ultra', 'Other']
            for distance in normalized_distances:
                if distance not in valid_distances:
                    raise ValueError(f'Distance "{distance}" must be one of: {", ".join(valid_distances)}')
            
            return normalized_distances
        
        # Handle list input (from date pickers)
        if isinstance(v, list):
            if not v or len(v) == 0:
                raise ValueError('At least one distance is required')
            valid_distances = ['5K', '10K', 'Half Marathon', 'Marathon', 'Ultra', 'Other']
            for distance in v:
                if distance not in valid_distances:
                    raise ValueError(f'Distance "{distance}" must be one of: {", ".join(valid_distances)}')
            return v
        
        raise ValueError('Distance must be string or list of strings')

    @field_validator('kid_run')
    @classmethod
    @cached_validation
    def validate_kid_run(cls, v: Union[bool, str, int]) -> bool:
        if isinstance(v, bool):
            return v
        
        if isinstance(v, str):
            v_upper = v.upper().strip()
            if v_upper in ['TRUE', 'YES', '1', 'T', 'Y']:
                return True
            elif v_upper in ['FALSE', 'NO', '0', 'F', 'N']:
                return False
            else:
                raise ValueError(f'kid_run value "{v}" not recognized. Use TRUE/FALSE, YES/NO, 1/0, T/F, or Y/N')
        
        if isinstance(v, int):
            if v == 1:
                return True
            elif v == 0:
                return False
            else:
                raise ValueError(f'kid_run value {v} not recognized. Use 1 for True, 0 for False')
        
        raise ValueError('kid_run must be boolean, string, or integer')

    @field_validator('latitude')
    @classmethod
    @cached_validation
    def validate_latitude(cls, v: Optional[float]) -> Optional[float]:
        if v is not None:
            # Basic range validation
            if v < -90 or v > 90:
                raise ValueError('Latitude must be between -90 and 90')
        return v

    @field_validator('longitude')
    @classmethod
    @cached_validation
    def validate_longitude(cls, v: Optional[float]) -> Optional[float]:
        if v is not None:
            # Basic range validation
            if v < -180 or v > 180:
                raise ValueError('Longitude must be between -180 and 180')
        return v

class RaceUpdate(BaseModel):
    name: Optional[str] = None
    date: Optional[Union[date, str]] = None
    start_time: Optional[Union[time, str]] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip: Optional[str] = None
    surface: Optional[str] = None
    distance: Optional[list[str]] = None
    kid_run: Optional[bool] = None
    official_website_url: Optional[Union[HttpUrl, str]] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    source: Optional[str] = None

    @field_validator('name')
    @classmethod
    @cached_validation
    def validate_name(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            if not v or len(v.strip()) < 2:
                raise ValueError('Name must be at least 2 characters')
            if len(v) > 100:
                raise ValueError('Name must be less than 100 characters')
            
            return v.strip()
        
        return v

    @field_validator('date')
    @classmethod
    @cached_validation
    def validate_date(cls, v: Optional[Union[date, str]]) -> Optional[date]:
        if v is None:
            return v
            
        if isinstance(v, date):
            return v
        
        if isinstance(v, str):
            # Try multiple date formats
            date_formats = [
                '%m/%d/%Y',      # 8/19/2025
                '%m-%d-%Y',      # 8-19-2025
                '%Y-%m-%d',      # 2025-08-19 (ISO)
                '%m/%d/%y',      # 8/19/25
                '%B %d, %Y',     # August 19, 2025
            ]
            
            for fmt in date_formats:
                try:
                    return datetime.strptime(v, fmt).date()
                except ValueError:
                    continue
            
            # If all formats fail, raise clear error
            raise ValueError(f'Date "{v}" not recognized. Supported formats: MM/DD/YYYY, YYYY-MM-DD, MM/DD/YY, Month DD, YYYY')
        
        raise ValueError('Date must be string or date object')

    @field_validator('start_time')
    @classmethod
    @cached_validation
    def validate_start_time(cls, v: Optional[Union[time, str]]) -> Optional[time]:
        if v is None:
            return v
            
        if isinstance(v, time):
            return v
            
        if isinstance(v, str):
            try:
                return time.fromisoformat(v)
            except ValueError:
                raise ValueError('Start time must be in ISO format (HH:MM or HH:MM:SS)')
        
        raise ValueError('Start time must be string or time object')

    @field_validator('city')
    @classmethod
    @cached_validation
    def validate_city(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and (not v or len(v.strip()) < 1):
            raise ValueError('City cannot be empty')
        return v.strip() if v else v

    @field_validator('state')
    @classmethod
    @cached_validation
    def validate_state(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and (not v or len(v.strip()) < 1):
            raise ValueError('State cannot be empty')
        return v.strip() if v else v

    @field_validator('surface')
    @classmethod
    @cached_validation
    def validate_surface(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            valid_surfaces = ['road', 'trail', 'track', 'virtual', 'other']
            if v not in valid_surfaces:
                raise ValueError(f'Surface must be one of: {", ".join(valid_surfaces)}')
        return v

    @field_validator('distance')
    @classmethod
    @cached_validation
    def validate_distance(cls, v: Optional[Union[list[str], str]]) -> Optional[list[str]]:
        if v is None:
            return v
            
        if isinstance(v, str):
            # Handle CSV input like "5K, Half, U" or "5K"
            if ',' in v:
                # Split by comma and clean up
                distances = [d.strip() for d in v.split(',') if d.strip()]
            else:
                # Single distance
                distances = [v.strip()]
            
            # Map abbreviated forms to full names
            distance_mapping = {
                '5K': '5K',
                '10K': '10K',
                'Half': 'Half Marathon',
                'H': 'Half Marathon',
                'Marathon': 'Marathon',
                'M': 'Marathon',
                'Ultra': 'Ultra',
                'U': 'Ultra',
                'Other': 'Other',
                'O': 'Other'
            }
            
            # Convert abbreviated forms to full names
            normalized_distances = []
            for distance in distances:
                normalized = distance_mapping.get(distance, distance)
                normalized_distances.append(normalized)
            
            # Validate each distance
            valid_distances = ['5K', '10K', 'Half Marathon', 'Marathon', 'Ultra', 'Other']
            for distance in normalized_distances:
                if distance not in valid_distances:
                    raise ValueError(f'Distance "{distance}" must be one of: {", ".join(valid_distances)}')
            
            return normalized_distances
        
        # Handle list input (from date pickers)
        if isinstance(v, list):
            if len(v) == 0:
                raise ValueError('At least one distance is required')
            valid_distances = ['5K', '10K', 'Half Marathon', 'Marathon', 'Ultra', 'Other']
            for distance in v:
                if distance not in valid_distances:
                    raise ValueError(f'Distance "{distance}" must be one of: {", ".join(valid_distances)}')
            return v
        
        raise ValueError('Distance must be string or list of strings')

    @field_validator('kid_run')
    @classmethod
    @cached_validation
    def validate_kid_run(cls, v: Optional[Union[bool, str, int]]) -> Optional[bool]:
        if v is None:
            return v
            
        if isinstance(v, bool):
            return v
        
        if isinstance(v, str):
            v_upper = v.upper().strip()
            if v_upper in ['TRUE', 'YES', '1', 'T', 'Y']:
                return True
            elif v_upper in ['FALSE', 'NO', '0', 'F', 'N']:
                return False
            else:
                raise ValueError(f'kid_run value "{v}" not recognized. Use TRUE/FALSE, YES/NO, 1/0, T/F, or Y/N')
        
        if isinstance(v, int):
            if v == 1:
                return True
            elif v == 0:
                return False
            else:
                raise ValueError(f'kid_run value {v} not recognized. Use 1 for True, 0 for False')
        
        raise ValueError('kid_run must be boolean, string, or integer')

    @field_validator('latitude')
    @classmethod
    @cached_validation
    def validate_latitude(cls, v: Optional[float]) -> Optional[float]:
        if v is not None:
            # Basic range validation
            if v < -90 or v > 90:
                raise ValueError('Latitude must be between -90 and 90')
        return v

    @field_validator('longitude')
    @classmethod
    @cached_validation
    def validate_longitude(cls, v: Optional[float]) -> Optional[float]:
        if v is not None:
            if v < -180 or v > 180:
                raise ValueError('Longitude must be between -180 and 180')
        return v

class RaceResponse(BaseModel):
    id: int
    name: str
    date: Union[date, str]
    start_time: Optional[Union[time, str]] = None
    tz: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    geom: Optional[str] = None
    surface: Optional[str] = None
    distance: Optional[list[str]] = None
    kid_run: bool
    official_website_url: Optional[str] = None
    source: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


# Club Models
class ClubBase(BaseModel):
    club_name: str
    location: Optional[str] = None
    website_url: Optional[str] = None

class ClubCreate(ClubBase):
    pass

class ClubUpdate(BaseModel):
    club_name: Optional[str] = None
    location: Optional[str] = None
    website_url: Optional[str] = None

class ClubResponse(ClubBase):
    id: int
    class Config:
        orm_mode = True
