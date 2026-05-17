import { AiOutlineWhatsApp } from 'react-icons/ai';
import { useState } from 'react';
import { getPublicShopById } from '../api/shop-service/shop-api';

type CartItem = {
  name: string;
  quantity: number;
};

type Props = {
  shopId: string;
  shopName?: string;
  cartItems: CartItem[];
  label?: string;
  className?: string;
  variant?: 'floating' | 'inline';
};

const formatItems = (cartItems: CartItem[]) =>
  cartItems.map((item) => `${item.quantity}x ${item.name}`).join(', ');

const WhatsAppButton = ({
  shopId,
  shopName,
  cartItems,
  label = 'Confirmar por WhatsApp',
  className = '',
  variant = 'floating',
}: Props) => {
  const [loading, setLoading] = useState(false);

  const getStorePhone = async (id: string): Promise<string | null> => {
    try {
      const data = await getPublicShopById(id);
      return data.phoneNumber ?? null;
    } catch (error) {
      console.error('Error fetching shop phone:', error);
      return null;
    }
  };

  const cleanPhoneForWa = (raw: string) => raw.replace(/[^0-9+]/g, '').replace(/^\+/, '');

  const handleClick = async () => {
    if (cartItems.length === 0) {
      alert('Tu carrito está vacío');
      return;
    }

    setLoading(true);
    try {
      const phone = await getStorePhone(shopId);

      if (!phone) {
        alert('No se encontró número de teléfono para la tienda');
        return;
      }

      const cleanPhone = cleanPhoneForWa(phone);
      if (!cleanPhone) {
        alert('Número de teléfono inválido');
        return;
      }

      const message = `Hola, estoy interesado en ${formatItems(cartItems)}, vengo de la tienda ${shopName ?? 'la tienda'}`;
      const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

      window.open(url, '_blank', 'noopener,noreferrer');
    } finally {
      setLoading(false);
    }
  };

  const buttonClassName =
    variant === 'floating'
      ? `fixed bottom-4 right-4 inline-flex items-center gap-2 rounded-full bg-green-500 px-4 py-3 text-white shadow-lg transition-colors duration-300 hover:bg-green-600 ${className}`
      : `inline-flex items-center gap-2 rounded-full bg-green-500 px-4 py-3 text-white shadow-lg transition-colors duration-300 hover:bg-green-600 ${className}`;

  return (
    <button onClick={handleClick} disabled={loading} className={buttonClassName}>
      <AiOutlineWhatsApp size={20} />
      <span>{loading ? 'Abriendo...' : label}</span>
    </button>
  );
};

export default WhatsAppButton;