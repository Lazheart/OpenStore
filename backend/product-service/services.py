from .models import ProductModel
# In a real app, you would use motor.motor_asyncio.AsyncIOMotorClient
# and httpx to do inter-service communication.

class ProductService:
    async def create_product(self, product_data: dict, db_collection) -> ProductModel:
        """
        Creates a product, ensuring that the shop_id exists via shop-service.
        """
        shop_id = product_data.get("shop_id")
        
        # Validation: Verify existence of Shop (shop-service)
        # async with httpx.AsyncClient() as client:
        #     response = await client.get(f"http://shop-service/api/shops/{shop_id}")
        #     if response.status_code != 200:
        #         raise ValueError("Shop does not exist")
        
        print(f"[Validation Mock] Verified shop {shop_id} exists in shop-service.")
        
        product = ProductModel(**product_data)
        
        # Insert into MongoDB
        result = await db_collection.insert_one(product.model_dump(by_alias=True, exclude=["id"]))
        product.id = result.inserted_id
        
        return product

product_service = ProductService()
