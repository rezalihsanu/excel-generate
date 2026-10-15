import httpx
from typing import Any, Dict, List, Optional
from app.core.config import settings

class SupabaseClient:
    def __init__(self):
        self.base_url = settings.SUPABASE_URL
        self.service_key = settings.SUPABASE_SERVICE_ROLE_KEY
        self.pub_key = settings.SUPABASE_PUBLISHABLE_KEY

    def _headers(self, user_token: Optional[str] = None) -> Dict[str, str]:
        token = user_token if user_token else self.service_key
        return {
            "apikey": self.service_key,
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }

    # ==========================
    # Database Table Operations
    # ==========================
    async def insert(self, table: str, record: Dict[str, Any], user_token: Optional[str] = None) -> Dict[str, Any]:
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.post(
                f"{self.base_url}/rest/v1/{table}",
                headers=self._headers(user_token),
                json=record
            )
            res.raise_for_status()
            data = res.json()
            return data[0] if isinstance(data, list) and len(data) > 0 else data

    async def select(self, table: str, params: Dict[str, str], user_token: Optional[str] = None) -> List[Dict[str, Any]]:
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.get(
                f"{self.base_url}/rest/v1/{table}",
                headers=self._headers(user_token),
                params=params
            )
            res.raise_for_status()
            return res.json()

    async def update(self, table: str, params: Dict[str, str], values: Dict[str, Any], user_token: Optional[str] = None) -> List[Dict[str, Any]]:
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.patch(
                f"{self.base_url}/rest/v1/{table}",
                headers=self._headers(user_token),
                params=params,
                json=values
            )
            res.raise_for_status()
            return res.json()

    async def delete(self, table: str, params: Dict[str, str], user_token: Optional[str] = None) -> List[Dict[str, Any]]:
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.delete(
                f"{self.base_url}/rest/v1/{table}",
                headers=self._headers(user_token),
                params=params
            )
            res.raise_for_status()
            return res.json()

    # ==========================
    # Storage Operations
    # ==========================
    async def upload_file(self, bucket: str, path: str, content: bytes, content_type: str) -> str:
        async with httpx.AsyncClient(timeout=30.0) as client:
            headers = {
                "apikey": self.service_key,
                "Authorization": f"Bearer {self.service_key}",
                "Content-Type": content_type,
                "x-upsert": "true"
            }
            res = await client.post(
                f"{self.base_url}/storage/v1/object/{bucket}/{path}",
                headers=headers,
                content=content
            )
            res.raise_for_status()
            return path

    async def download_file(self, bucket: str, path: str) -> bytes:
        async with httpx.AsyncClient(timeout=30.0) as client:
            headers = {
                "apikey": self.service_key,
                "Authorization": f"Bearer {self.service_key}"
            }
            res = await client.get(
                f"{self.base_url}/storage/v1/object/{bucket}/{path}",
                headers=headers
            )
            res.raise_for_status()
            return res.content

    async def create_signed_url(self, bucket: str, path: str, expires_in: int = 3600) -> str:
        async with httpx.AsyncClient(timeout=10.0) as client:
            headers = {
                "apikey": self.service_key,
                "Authorization": f"Bearer {self.service_key}",
                "Content-Type": "application/json"
            }
            res = await client.post(
                f"{self.base_url}/storage/v1/object/sign/{bucket}/{path}",
                headers=headers,
                json={"expiresIn": expires_in}
            )
            res.raise_for_status()
            data = res.json()
            signed_url_path = data.get("signedURL", "")
            return f"{self.base_url}/storage/v1{signed_url_path}"

supabase = SupabaseClient()
