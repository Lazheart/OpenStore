from typing import Optional

from pydantic import BaseModel, Field, model_validator


class AuthLoginRequest(BaseModel):
	identifier: str = Field(min_length=1)
	password: str = Field(min_length=1)
	shopId: Optional[int] = None


class AuthRegisterRequest(BaseModel):
	email: str = Field(min_length=1)
	phoneNumber: str = Field(min_length=1)
	name: str = Field(min_length=1)
	shopId: Optional[int] = None


class ShopCreateRequest(BaseModel):
	shopName: str = Field(min_length=1)
	phoneNumber: str = Field(min_length=1)


class ShopUpdateRequest(BaseModel):
	shopName: Optional[str] = None
	phoneNumber: Optional[str] = None

	@model_validator(mode="after")
	def validate_at_least_one_field(self) -> "ShopUpdateRequest":
		if not self.shopName and not self.phoneNumber:
			raise ValueError("Debes enviar shopName, phoneNumber o ambos")
		return self


class UserDeletedEventRequest(BaseModel):
	role: Optional[str] = None


def build_shop_create_payload(request: ShopCreateRequest) -> dict[str, str]:
	return {
		"shopName": request.shopName.strip(),
		"phoneNumber": request.phoneNumber.strip(),
	}


def build_shop_update_payload(request: ShopUpdateRequest) -> dict[str, str]:
	payload: dict[str, str] = {}
	if request.shopName is not None:
		payload["shopName"] = request.shopName.strip()
	if request.phoneNumber is not None:
		payload["phoneNumber"] = request.phoneNumber.strip()
	return payload
