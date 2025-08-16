from pydantic import BaseModel, HttpUrl
from typing import Optional, Union
from datetime import date, time

class AdminLogin(BaseModel):
    username: str
    password: str

class AdminLoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    username: str

class RaceCreate(BaseModel):
    name: str
    date: Union[date, str]
    start_time: Optional[Union[time, str]] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip: Optional[str] = None
    surface: Optional[str] = None
    kid_run: bool = False
    official_website_url: Optional[Union[HttpUrl, str]] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class RaceUpdate(BaseModel):
    name: Optional[str] = None
    date: Optional[Union[date, str]] = None
    start_time: Optional[Union[time, str]] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip: Optional[str] = None
    surface: Optional[str] = None
    kid_run: Optional[bool] = None
    official_website_url: Optional[Union[HttpUrl, str]] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class RaceResponse(BaseModel):
    id: int
    name: str
    date: Union[date, str]
    start_time: Optional[Union[time, str]] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip: Optional[str] = None
    surface: Optional[str] = None
    kid_run: bool
    official_website_url: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
