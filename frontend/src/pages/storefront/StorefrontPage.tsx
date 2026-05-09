import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { getPublicShopById, getShopPublicTheme } from '../../api/shop-service/shop-api';
import { getProductsByShop } from '../../api/product-service/product-api';
import { DEFAULT_THEME_KEY, THEME_REGISTRY } from './themeRegistry';
import { mapApiProductsToCatalog } from './mapCatalogProducts';
import type { ShopThemeJson } from './themeTypes';
import type { Product } from '../template/DevStyle';

function decodeShopSlug(raw: string | undefined): string {
  if (!raw) return '';
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export default function StorefrontPage() {
  const { shopSlug } = useParams<{ shopSlug: string }>();
  const [searchParams] = useSearchParams();
  const id = (searchParams.get('id') ?? '').trim();

  const slugDecoded = useMemo(() => decodeShopSlug(shopSlug), [shopSlug]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shopId, setShopId] = useState('');
  const [shopName, setShopName] = useState('');
  const [themeKey, setThemeKey] = useState(DEFAULT_THEME_KEY);
  const [themeConfig, setThemeConfig] = useState<ShopThemeJson | null>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setError(null);
      if (!slugDecoded) {
        setError('Ruta de tienda no válida.');
        setLoading(false);
        return;
      }
      if (!id) {
        setError('Falta el parámetro id  en la URL (ej. ?id=uuid-de-la-tienda).');
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const [shop, theme] = await Promise.all([
          getPublicShopById(id),
          getShopPublicTheme(id),
        ]);
        if (cancelled) return;

        const resolvedName = shop.shopName ?? shop.name ?? '';
        if (resolvedName !== slugDecoded) {
          setError('El nombre en la URL no coincide con la tienda indicada.');
          setLoading(false);
          return;
        }

        setShopId(shop.shopId ?? shop.id ?? id);
        setShopName(resolvedName);
        setThemeKey(theme.themeKey || DEFAULT_THEME_KEY);
        setThemeConfig((theme.config ?? {}) as ShopThemeJson);
      } catch (e) {
        if (!cancelled) {
          setError('No se pudo cargar la tienda o su tema. Comprueba el id y tu conexión al API.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [slugDecoded, id]);

  const [catalog, setCatalog] = useState<Product[]>([]);

  useEffect(() => {
    if (!shopId || error) return;

    let cancelled = false;
    void (async () => {
      try {
        const rows = await getProductsByShop(shopId);
        if (cancelled) return;
        setCatalog(mapApiProductsToCatalog(rows));
      } catch {
        if (!cancelled) setCatalog([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [shopId, error]);

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', fontFamily: 'system-ui' }}>
        Cargando tienda…
      </div>
    );
  }

  if (error || !shopId) {
    return (
      <div style={{ padding: '3rem', maxWidth: 480, margin: '0 auto', fontFamily: 'system-ui' }}>
        <h1 style={{ fontSize: '1.25rem' }}>Storefront</h1>
        <p style={{ color: '#b91c1c' }}>{error}</p>
      </div>
    );
  }

  const ThemeComponent = THEME_REGISTRY[themeKey] ?? THEME_REGISTRY[DEFAULT_THEME_KEY];

  return (
    <ThemeComponent
      shopId={shopId}
      shopName={shopName}
      themeConfig={themeConfig}
      catalogProducts={catalog}
    />
  );
}
