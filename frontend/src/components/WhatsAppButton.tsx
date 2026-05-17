import { AiOutlineWhatsApp } from "react-icons/ai";
import React, { useState } from "react";

type CartItem = { name: string; quantity?: number; price?: number };

type Props = {
  shopId: string;
  shopName?: string;
  productName?: string;
  cartItems?: CartItem[];
  label?: string;
  className?: string;
};

const formatItems = (productName?: string, cartItems?: CartItem[]) => {
  if (cartItems && cartItems.length > 0) {
    return cartItems
      .map((it) => `${it.quantity ?? 1}x ${it.name}`)
      .join(', ');
  }
  return productName ?? '';
};

const WhatsAppButton: React.FC<Props> = ({
  shopId,
  shopName,
  productName,
  cartItems,
  label = 'Comprar por WhatsApp',
  className = '',
}) => {
  const [loading, setLoading] = useState(false);

  const getStorePhone = async (id: string): Promise<string | null> => {
    try {
      const STORE_SERVICE_URL = (import.meta.env.VITE_STORE_SERVICE_URL as string) || '';
      const base = STORE_SERVICE_URL || '';
      const url = `${base}/shop/${encodeURIComponent(id)}`;
      const res = await fetch(url);
      if (!res.ok) return null;
      const data = await res.json();
      // expecting { phoneNumber: string, ... }
      return data.phoneNumber ?? data.phone ?? null;
    } catch (e) {
      console.error('Error fetching shop phone:', e);
      return null;
    }
  };

  const cleanPhoneForWa = (raw: string) => raw.replace(/[^0-9+]/g, '').replace(/^\+/, '');

  const handleClick = async () => {
    setLoading(true);
    try {
      const phone = await getStorePhone(shopId);
      if (!phone) {
        alert('No se encontro numero de telefono para la tienda');
        setLoading(false);
        return;
      }

      const clean = cleanPhoneForWa(phone);
      if (!clean) {
        alert('Numero de telefono invalido');
        setLoading(false);
        return;
      }

      const itemsText = formatItems(productName, cartItems);
      const message = `Hola, estoy interesado en [carrito de compras ${itemsText}] vengo de ${shopName ?? 'la tienda'}`;
      const url = `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;

      window.open(url, '_blank');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`fixed bottom-4 right-4 bg-green-500 text-white p-3 rounded-full shadow-lg hover:bg-green-600 transition-colors duration-300 ${className}`}
    >
      <AiOutlineWhatsApp size={20} />
      <span className="ml-2 hidden sm:inline">{loading ? 'Abriendo...' : label}</span>
    </button>
  );
};

export default WhatsAppButton;