-- Add Chicago Storage Lots for Test Drivers
-- These are the three storage lots that drivers will use when picking up vehicles

-- First, ensure we have a Chicago market (or use existing market)
-- If no market exists, we'll need to create one or use a default
DO $$
DECLARE
  chicago_market_id UUID;
  default_company_id UUID;
BEGIN
  -- Get the first active market or create a Chicago market
  SELECT id INTO chicago_market_id 
  FROM markets 
  WHERE name ILIKE '%chicago%' OR name ILIKE '%illinois%' OR name ILIKE '%il%'
  LIMIT 1;
  
  -- If no Chicago market exists, use the first active market or create one
  IF chicago_market_id IS NULL THEN
    SELECT id INTO chicago_market_id 
    FROM markets 
    WHERE is_active = true 
    LIMIT 1;
    
    -- If still no market, create a Chicago market
    IF chicago_market_id IS NULL THEN
      INSERT INTO markets (name, state, is_active, created_at)
      VALUES ('Chicago', 'IL', true, NOW())
      RETURNING id INTO chicago_market_id;
    END IF;
  END IF;
  
  -- Get the first company (for multi-tenancy)
  BEGIN
    SELECT id INTO default_company_id 
    FROM companies 
    LIMIT 1;
  EXCEPTION
    WHEN undefined_table THEN
      default_company_id := NULL;
  END;
  
  -- Add the three Chicago storage lots (only if they don't exist)
  -- Coordinates are approximate and should be verified/updated via geocoding
  
  -- 1. Calumet Park Lot
  IF NOT EXISTS (SELECT 1 FROM storage_lots WHERE address = '12109 Paulina St, Calumet Park, IL 60827') THEN
    IF default_company_id IS NOT NULL THEN
      INSERT INTO storage_lots (market_id, company_id, name, type, address, lat, lng, is_active, created_at)
      VALUES (
        chicago_market_id,
        default_company_id,
        'Calumet Park Lot',
        'lot',
        '12109 Paulina St, Calumet Park, IL 60827',
        41.6600,  -- Approximate - should be geocoded
        -87.6600, -- Approximate - should be geocoded
        true,
        NOW()
      );
    ELSE
      INSERT INTO storage_lots (market_id, name, type, address, lat, lng, is_active, created_at)
      VALUES (
        chicago_market_id,
        'Calumet Park Lot',
        'lot',
        '12109 Paulina St, Calumet Park, IL 60827',
        41.6600,
        -87.6600,
        true,
        NOW()
      );
    END IF;
  END IF;
  
  -- 2. Melrose Park Lot
  IF NOT EXISTS (SELECT 1 FROM storage_lots WHERE address = '4699 W Lake St, Melrose Park, IL 60160') THEN
    IF default_company_id IS NOT NULL THEN
      INSERT INTO storage_lots (market_id, company_id, name, type, address, lat, lng, is_active, created_at)
      VALUES (
        chicago_market_id,
        default_company_id,
        'Melrose Park Lot',
        'lot',
        '4699 W Lake St, Melrose Park, IL 60160',
        41.9000,  -- Approximate - should be geocoded
        -87.8600, -- Approximate - should be geocoded
        true,
        NOW()
      );
    ELSE
      INSERT INTO storage_lots (market_id, name, type, address, lat, lng, is_active, created_at)
      VALUES (
        chicago_market_id,
        'Melrose Park Lot',
        'lot',
        '4699 W Lake St, Melrose Park, IL 60160',
        41.9000,
        -87.8600,
        true,
        NOW()
      );
    END IF;
  END IF;
  
  -- 3. Joliet Lot
  IF NOT EXISTS (SELECT 1 FROM storage_lots WHERE address = '827 Gardner St, Joliet, IL 60433') THEN
    IF default_company_id IS NOT NULL THEN
      INSERT INTO storage_lots (market_id, company_id, name, type, address, lat, lng, is_active, created_at)
      VALUES (
        chicago_market_id,
        default_company_id,
        'Joliet Lot',
        'lot',
        '827 Gardner St, Joliet, IL 60433',
        41.5200,  -- Approximate - should be geocoded
        -88.0800, -- Approximate - should be geocoded
        true,
        NOW()
      );
    ELSE
      INSERT INTO storage_lots (market_id, name, type, address, lat, lng, is_active, created_at)
      VALUES (
        chicago_market_id,
        'Joliet Lot',
        'lot',
        '827 Gardner St, Joliet, IL 60433',
        41.5200,
        -88.0800,
        true,
        NOW()
      );
    END IF;
  END IF;
  
  RAISE NOTICE '✅ Chicago storage lots added successfully';
  RAISE NOTICE '📍 Market ID: %', chicago_market_id;
  RAISE NOTICE '🏢 Company ID: %', default_company_id;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error adding Chicago storage lots: %', SQLERRM;
END $$;

-- Verify the lots were added
SELECT 
  id,
  name,
  address,
  lat,
  lng,
  is_active,
  created_at
FROM storage_lots
WHERE address LIKE '%Calumet Park%' 
   OR address LIKE '%Melrose Park%'
   OR address LIKE '%Joliet%'
ORDER BY created_at DESC;

