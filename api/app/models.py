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
                # Try ISO format first (HH:MM:SS)
                return time.fromisoformat(v)
            except ValueError:
                try:
                    # Try parsing common formats like "9:00:00" or "9:00"
                    if ':' in v:
                        parts = v.split(':')
                        if len(parts) == 2:
                            # "9:00" format
                            hour = int(parts[0])
                            minute = int(parts[1])
                            return time(hour=hour, minute=minute)
                        elif len(parts) == 3:
                            # "9:00:00" format
                            hour = int(parts[0])
                            minute = int(parts[1])
                            second = int(parts[2])
                            return time(hour=hour, minute=minute, second=second)
                except (ValueError, IndexError):
                    pass
                
                raise ValueError('Start time must be in format HH:MM or HH:MM:SS (e.g., "9:00" or "9:00:00")')
        
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
        if not v:
            raise ValueError('Surface is required')
        # Convert to lowercase for case-insensitive comparison
        v_lower = v.lower()
        valid_surfaces = ['road', 'trail', 'track', 'virtual', 'other']
        if v_lower not in valid_surfaces:
            raise ValueError(f'Surface must be one of: {", ".join(valid_surfaces)}')
        # Return the lowercase value for consistency in database
        return v_lower

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
            
            # Smart mapping to standardized lowercase values
            distance_mapping = {
                # 5K variations
                '5K': '5k', '5k': '5k', '5 K': '5k', '5 k': '5k',
                # 10K variations  
                '10K': '10k', '10k': '10k', '10 K': '10k', '10 k': '10k',
                # Half Marathon variations
                'Half': 'half marathon', 'Half Marathon': 'half marathon', 'HALF': 'half marathon', 'half': 'half marathon',
                # Marathon variations
                'Full': 'marathon', 'Marathon': 'marathon', 'FULL': 'marathon', 'full': 'marathon', 'marathon': 'marathon',
                # Ultra variations
                'Ultra': 'ultra', 'ultra': 'ultra', 'ULTRA': 'ultra',
                # Kids/Other variations
                'Kids': 'other', 'kids': 'other', 'KIDS': 'other', 'Kid Run': 'other', 'kid run': 'other', 'Other': 'other', 'other': 'other'
            }
            
            # Convert to standardized values
            normalized_distances = []
            for distance in distances:
                normalized = distance_mapping.get(distance, distance.lower())
                normalized_distances.append(normalized)
            
            # Validate each distance against our standardized values
            valid_distances = ['5k', '10k', 'half marathon', 'marathon', 'ultra', 'other']
            for distance in normalized_distances:
                if distance not in valid_distances:
                    raise ValueError(f'Distance "{distance}" must be one of: {", ".join(valid_distances)}')
            
            return normalized_distances
        
        # Handle list input (from form pickers)
        if isinstance(v, list):
            if not v or len(v) == 0:
                raise ValueError('At least one distance is required')
            
            # Smart mapping for list input
            distance_mapping = {
                # 5K variations
                '5K': '5k', '5k': '5k', '5 K': '5k', '5 k': '5k',
                # 10K variations  
                '10K': '10k', '10k': '10k', '10 K': '10k', '10 k': '10k',
                # Half Marathon variations
                'Half': 'half marathon', 'Half Marathon': 'half marathon', 'HALF': 'half marathon', 'half': 'half marathon',
                # Marathon variations
                'Full': 'marathon', 'Marathon': 'marathon', 'FULL': 'marathon', 'full': 'marathon', 'marathon': 'marathon',
                # Ultra variations
                'Ultra': 'ultra', 'ultra': 'ultra', 'ULTRA': 'ultra',
                # Kids/Other variations
                'Kids': 'other', 'kids': 'other', 'KIDS': 'other', 'Kid Run': 'other', 'kid run': 'other', 'Other': 'other', 'other': 'other'
            }
            
            # Convert to standardized values
            normalized_distances = []
            for distance in v:
                normalized = distance_mapping.get(distance, distance.lower())
                normalized_distances.append(normalized)
            
            # Validate each distance
            valid_distances = ['5k', '10k', 'half marathon', 'marathon', 'ultra', 'other']
            for distance in normalized_distances:
                if distance not in valid_distances:
                    raise ValueError(f'Distance "{distance}" must be one of: {", ".join(valid_distances)}')
            
            return normalized_distances
        
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
                # Try ISO format first (HH:MM:SS)
                return time.fromisoformat(v)
            except ValueError:
                try:
                    # Try parsing common formats like "9:00:00" or "9:00"
                    if ':' in v:
                        parts = v.split(':')
                        if len(parts) == 2:
                            # "9:00" format
                            hour = int(parts[0])
                            minute = int(parts[1])
                            return time(hour=hour, minute=minute)
                        elif len(parts) == 3:
                            # "9:00:00" format
                            hour = int(parts[0])
                            minute = int(parts[1])
                            second = int(parts[2])
                            return time(hour=hour, minute=minute, second=second)
                except (ValueError, IndexError):
                    pass
                
                raise ValueError('Start time must be in format HH:MM or HH:MM:SS (e.g., "9:00" or "9:00:00")')
        
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
            # Convert to lowercase for case-insensitive comparison
            v_lower = v.lower()
            valid_surfaces = ['road', 'trail', 'track', 'virtual', 'other']
            if v_lower not in valid_surfaces:
                raise ValueError(f'Surface must be one of: {", ".join(valid_surfaces)}')
            # Return the lowercase value for consistency in database
            return v_lower
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
            
            # Smart mapping to standardized lowercase values
            distance_mapping = {
                # 5K variations
                '5K': '5k', '5k': '5k', '5 K': '5k', '5 k': '5k',
                # 10K variations  
                '10K': '10k', '10k': '10k', '10 K': '10k', '10 k': '10k',
                # Half Marathon variations
                'Half': 'half marathon', 'Half Marathon': 'half marathon', 'HALF': 'half marathon', 'half': 'half marathon',
                # Marathon variations
                'Full': 'marathon', 'Marathon': 'marathon', 'FULL': 'marathon', 'full': 'marathon', 'marathon': 'marathon',
                # Ultra variations
                'Ultra': 'ultra', 'ultra': 'ultra', 'ULTRA': 'ultra',
                # Kids/Other variations
                'Kids': 'other', 'kids': 'other', 'KIDS': 'other', 'Kid Run': 'other', 'kid run': 'other', 'Other': 'other', 'other': 'other'
            }
            
            # Convert to standardized values
            normalized_distances = []
            for distance in distances:
                normalized = distance_mapping.get(distance, distance.lower())
                normalized_distances.append(normalized)
            
            # Validate each distance against our standardized values
            valid_distances = ['5k', '10k', 'half marathon', 'marathon', 'ultra', 'other']
            for distance in normalized_distances:
                if distance not in valid_distances:
                    raise ValueError(f'Distance "{distance}" must be one of: {", ".join(valid_distances)}')
            
            return normalized_distances
        
        # Handle list input (from form pickers)
        if isinstance(v, list):
            if len(v) == 0:
                raise ValueError('At least one distance is required')
            
            # Smart mapping for list input
            distance_mapping = {
                # 5K variations
                '5K': '5k', '5k': '5k', '5 K': '5k', '5 k': '5k',
                # 10K variations  
                '10K': '10k', '10k': '10k', '10 K': '10k', '10 k': '10k',
                # Half Marathon variations
                'Half': 'half marathon', 'Half Marathon': 'half marathon', 'HALF': 'half marathon', 'half': 'half marathon',
                # Marathon variations
                'Full': 'marathon', 'Marathon': 'marathon', 'FULL': 'marathon', 'full': 'marathon', 'marathon': 'marathon',
                # Ultra variations
                'Ultra': 'ultra', 'ultra': 'ultra', 'ULTRA': 'ultra',
                # Kids/Other variations
                'Kids': 'other', 'kids': 'other', 'KIDS': 'other', 'Kid Run': 'other', 'kid run': 'other', 'Other': 'other', 'other': 'other'
            }
            
            # Convert to standardized values
            normalized_distances = []
            for distance in v:
                normalized = distance_mapping.get(distance, distance.lower())
                normalized_distances.append(normalized)
            
            # Validate each distance
            valid_distances = ['5k', '10k', 'half marathon', 'marathon', 'ultra', 'other']
            for distance in normalized_distances:
                if distance not in valid_distances:
                    raise ValueError(f'Distance "{distance}" must be one of: {", ".join(valid_distances)}')
            
            return normalized_distances
        
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


# Race Report Models
class RaceSummary(BaseModel):
    id: int
    name: str
    date: Union[date, str]
    city: Optional[str] = None
    state: Optional[str] = None
    surface: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    official_website_url: Optional[str] = None

class RaceReportBase(BaseModel):
    race_id: Optional[int] = None
    race_name: str  # Race name stored directly in reports
    race_date: date  # User-provided date, always required
    title: str
    author_name: Optional[str] = None
    content_md: str
    photos: list[str] = []

    @field_validator('race_id')
    @classmethod
    @cached_validation
    def validate_race_id(cls, v: Optional[int]) -> Optional[int]:
        # Allow null for orphaned reports
        if v is not None and v <= 0:
            raise ValueError('Race ID must be a positive integer if provided')
        return v

    @field_validator('race_name')
    @classmethod
    @cached_validation
    def validate_race_name(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError('Race name is required')
        if len(v.strip()) > 120:
            raise ValueError('Race name must be less than 120 characters')
        return v.strip()

    @field_validator('race_date')
    @classmethod
    @cached_validation
    def validate_race_date(cls, v: date) -> date:
        if not v:
            raise ValueError('Race date is required')
        return v

    @field_validator('title')
    @classmethod
    @cached_validation
    def validate_title(cls, v: str) -> str:
        if not v or len(v.strip()) < 3:
            raise ValueError('Title must be at least 3 characters')
        if len(v.strip()) > 120:
            raise ValueError('Title must be less than 120 characters')
        return v.strip()

    @field_validator('author_name')
    @classmethod
    @cached_validation
    def validate_author_name(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        if not v or len(v.strip()) < 2:
            raise ValueError('Author name must be at least 2 characters if provided')
        if len(v.strip()) > 80:
            raise ValueError('Author name must be less than 80 characters')
        return v.strip()

    @field_validator('content_md')
    @classmethod
    @cached_validation
    def validate_content_md(cls, v: str) -> str:
        if not v or len(v.strip()) < 10:
            raise ValueError('Content must be at least 10 characters')
        if len(v.strip()) > 20000:
            raise ValueError('Content must be less than 20,000 characters')
        return v.strip()

    @field_validator('photos')
    @classmethod
    @cached_validation
    def validate_photos(cls, v: list[str]) -> list[str]:
        if not isinstance(v, list):
            raise ValueError('Photos must be a list')
        
        for i, photo_url in enumerate(v):
            if not photo_url or not isinstance(photo_url, str):
                raise ValueError(f'Photo {i+1} must be a non-empty string')
            
            # Validate absolute URL format
            if not photo_url.startswith(('http://', 'https://')):
                raise ValueError(f'Photo {i+1} must be an absolute URL starting with http:// or https://')
        
        return v

class RaceReportCreate(RaceReportBase):
    pass

class RaceReportUpdate(BaseModel):
    race_id: Optional[int] = None
    race_name: Optional[str] = None
    race_date: Optional[date] = None
    title: Optional[str] = None
    author_name: Optional[str] = None
    content_md: Optional[str] = None
    photos: Optional[list[str]] = None

    @field_validator('race_id')
    @classmethod
    @cached_validation
    def validate_race_id(cls, v: Optional[int]) -> Optional[int]:
        # Allow null for orphaned reports
        if v is not None and v <= 0:
            raise ValueError('Race ID must be a positive integer if provided')
        return v

    @field_validator('race_name')
    @classmethod
    @cached_validation
    def validate_race_name(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            if not v or not v.strip():
                raise ValueError('Race name is required')
            if len(v.strip()) > 120:
                raise ValueError('Race name must be less than 120 characters')
            return v.strip()
        return v

    @field_validator('race_date')
    @classmethod
    @cached_validation
    def validate_race_date(cls, v: Optional[date]) -> Optional[date]:
        if v is not None:
            if not v:
                raise ValueError('Race date is required')
            return v
        return v

    @field_validator('title')
    @classmethod
    @cached_validation
    def validate_title(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            if not v or len(v.strip()) < 3:
                raise ValueError('Title must be at least 3 characters')
            if len(v.strip()) > 120:
                raise ValueError('Title must be less than 120 characters')
            return v.strip()
        return v

    @field_validator('author_name')
    @classmethod
    @cached_validation
    def validate_author_name(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            if not v or len(v.strip()) < 2:
                raise ValueError('Author name must be at least 2 characters if provided')
            if len(v.strip()) > 80:
                raise ValueError('Author name must be less than 80 characters')
            return v.strip()
        return v

    @field_validator('content_md')
    @classmethod
    @cached_validation
    def validate_content_md(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            if not v or len(v.strip()) < 10:
                raise ValueError('Content must be at least 10 characters')
            if len(v.strip()) > 20000:
                raise ValueError('Content must be less than 20,000 characters')
            return v.strip()
        return v

    @field_validator('photos')
    @classmethod
    @cached_validation
    def validate_photos(cls, v: Optional[list[str]]) -> Optional[list[str]]:
        if v is not None:
            if not isinstance(v, list):
                raise ValueError('Photos must be a list')
            
            for i, photo_url in enumerate(v):
                if not photo_url or not isinstance(photo_url, str):
                    raise ValueError(f'Photo {i+1} must be a non-empty string')
                
                # Validate absolute URL format
                if not photo_url.startswith(('http://', 'https://')):
                    raise ValueError(f'Photo {i+1} must be an absolute URL starting with http:// or https://')
        
        return v

class RaceReportResponse(BaseModel):
    id: int
    race_id: Optional[int]  # Can be null for orphaned reports
    race_date: Optional[str] = None  # Can be null for orphaned reports
    title: str
    author_name: Optional[str] = None
    content_md: str
    photos: list[str]
    created_at: str
    updated_at: str
    # Optional race summary when include_race=true
    race: Optional[RaceSummary] = None
