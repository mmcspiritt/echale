-- Idempotent content update for round 3.
-- Updates story copy, org names, covers and galleries.
-- Replaces example (non-real) paid rows and keeps each story's example total.
-- Real CoDi rows are not deleted. Matt's real row (id 5e4f93c2-…) only changes display name and message.

BEGIN;

UPDATE stories SET
  person_name = 'Adrián Soto',
  account_holder_name = 'Adrián Soto',
  title = 'Adrián Soto vuelve a Guanajuato',
  summary = 'Adrián vino a una obra en CDMX. Su mamá se puso mal en Guanajuato y no le alcanza para el boleto de regreso.',
  story = 'Adrián vino a CDMX a trabajar unos meses en una obra. Su mamá se puso mal en Guanajuato y la noticia lo agarró sin un peso ahorrado. Albergue Camino a Casa le dio dónde quedarse y le está ayudando a regresar. Con esto se paga su boleto en la Central del Norte y la comida del camino.',
  organization_name = 'Albergue Camino a Casa I.A.P.',
  gallery_images = '["/stories/adrian/adrian-cover-4x5.webp","/stories/adrian/adrian-gallery-2-3x2.webp"]'::jsonb,
  updated_at = NOW()
WHERE slug = 'adrian';

UPDATE stories SET
  title = 'Santiago necesita operarse la rodilla',
  summary = 'Santiago se lastimó la rodilla jugando fut los domingos y lleva meses sin poder trabajar.',
  story = 'Santiago trabaja por su cuenta como albañil en Puebla, sin seguro. Se rompió el ligamento de la rodilla en un partido y desde entonces anda con muleta. El ortopedista le dijo que necesita una artroscopia y luego terapia. Con esta meta paga la resonancia, la operación y las sesiones de rehabilitación para volver a la obra.',
  organization_name = 'Comunidad Sana A.C.',
  gallery_images = '["/stories/santiago/santiago-cover-4x5.webp","/stories/santiago/santiago-gallery-2-3x2.webp"]'::jsonb,
  milestones = '[
    {"id":"m1-santiago","label":"Resonancia y estudios","targetAmount":6000},
    {"id":"m2-santiago","label":"Operación (artroscopia)","targetAmount":38000},
    {"id":"m3-santiago","label":"Rehabilitación, 15 sesiones","targetAmount":50000}
  ]'::jsonb,
  updated_at = NOW()
WHERE slug = 'santiago';

UPDATE stories SET
  person_name = 'Doña Miriam',
  account_holder_name = 'Doña Miriam',
  title = 'Doña Miriam vuelve a tener un cuarto seguro',
  summary = 'El sismo le cuarteó la casa en la Mixteca y desde entonces duerme bajo una lona. Con $50,000 se levanta un cuarto firme.',
  story = 'Doña Miriam vive con su nieta en un pueblo de la Mixteca oaxaqueña. Con el sismo, los muros de adobe se cuartearon y el techo quedó a punto de caerse. La fundación ya revisó la casa con un albañil de la comunidad: primero el techo de lámina, luego muros de block con castillos, después piso y puerta, y al final una cocina sencilla.',
  organization_name = 'Fundación Cuarto Firme A.C.',
  cover_image = '/stories/miriam/miriam-gallery-2-3x2.webp',
  gallery_images = '[
    "/stories/miriam/miriam-gallery-2-3x2.webp",
    "/stories/miriam/miriam-cover-4x5.webp",
    "/stories/miriam/miriam-gallery-1-1x1.webp"
  ]'::jsonb,
  milestones = '[
    {"id":"m1-miriam","label":"Techo de lámina","targetAmount":10000},
    {"id":"m2-miriam","label":"Muros de block con castillos","targetAmount":25000},
    {"id":"m3-miriam","label":"Piso y puerta","targetAmount":40000},
    {"id":"m4-miriam","label":"Cocina sencilla","targetAmount":50000}
  ]'::jsonb,
  updated_at = NOW()
WHERE slug = 'miriam';

CREATE OR REPLACE FUNCTION echale_round3_example_amounts(target numeric, slug text)
RETURNS numeric[]
LANGUAGE plpgsql
AS $$
DECLARE
  remaining numeric := round(target, 2);
  amounts numeric[] := ARRAY[]::numeric[];
  cycle numeric[] := ARRAY[100,200,150,300,250,100,200,50,300,150,400,200,100,250,300,500,150,200]::numeric[];
  next_amt numeric;
  i int := 0;
  specified numeric[] := ARRAY[100,50,200,150,100,70,50]::numeric[];
  specified_sum numeric;
BEGIN
  IF slug = 'adrian' THEN
    SELECT COALESCE(SUM(value), 0) INTO specified_sum FROM unnest(specified) AS value;
    IF round(remaining, 2) = round(specified_sum, 2) THEN
      RETURN specified;
    END IF;
    specified[7] := round(specified[7] + (remaining - specified_sum), 2);
    IF specified[7] > 0 AND specified[7] <= 500 THEN
      RETURN specified;
    END IF;
  END IF;

  IF remaining >= 7500 THEN
    amounts := amounts || 5000::numeric;
    remaining := round(remaining - 5000, 2);
  END IF;
  IF remaining >= 3500 THEN
    amounts := amounts || 2000::numeric;
    remaining := round(remaining - 2000, 2);
  END IF;

  WHILE remaining > 500 AND i < 400 LOOP
    next_amt := cycle[(i % array_length(cycle, 1)) + 1];
    IF next_amt > remaining THEN
      EXIT;
    END IF;
    amounts := amounts || next_amt;
    remaining := round(remaining - next_amt, 2);
    i := i + 1;
  END LOOP;

  WHILE remaining > 500 LOOP
    next_amt := LEAST(500::numeric, remaining);
    amounts := amounts || next_amt;
    remaining := round(remaining - next_amt, 2);
  END LOOP;

  IF remaining > 0 THEN
    IF array_length(amounts, 1) IS NULL THEN
      amounts := amounts || remaining;
    ELSIF remaining < 50 THEN
      amounts[array_length(amounts, 1)] := round(amounts[array_length(amounts, 1)] + remaining, 2);
    ELSE
      amounts := amounts || remaining;
    END IF;
  END IF;

  RETURN amounts;
END;
$$;

DO $$
DECLARE
  story_row record;
  target numeric;
  amounts numeric[];
  amount numeric;
  idx int;
  donor text;
  note text;
  used_companeros boolean;
  used_familia boolean;
  names text[] := ARRAY[
    'Lupita','Toño','Fer','Majo','Chuy','Vale','Neto','Gaby','Paco','Rocío',
    'Beto','Lalo','Sofi','Diego','Mari','José','Ana','Iker','Nayeli','Paola',
    'Memo','Citlali','Raúl','Yola','Hugo','Iris','Omar','Tere','Bruno','Caro'
  ];
  notes text[] := ARRAY[
    '¡Échale ganas, Santi!',
    'Fuerza, Doña Miriam',
    'De parte de los primos en LA',
    'Aquí andamos.',
    'Un abrazo.',
    'Para lo que haga falta.',
    'Cuenta con nosotros.',
    'Ánimo.',
    'De parte de la familia.',
    'Va con cariño.'
  ];
  inserted_sum numeric;
  adrian_names text[] := ARRAY['Majo','Luis','Anónimo','Fer','Toño','Vale','Chuy'];
  adrian_notes text[] := ARRAY[
    'Buen viaje de regreso.',
    'Para el boleto.',
    NULL,
    'De parte de los primos en LA',
    'Aquí andamos.',
    'Ánimo, Adrián.',
    'Pa'' que comas en el camino.'
  ];
BEGIN
  FOR story_row IN
    SELECT id, slug, pey_key_env FROM stories WHERE slug IN ('adrian', 'santiago', 'miriam')
  LOOP
    SELECT COALESCE(SUM(payments.amount), 0) INTO target
    FROM payments
    WHERE story_id = story_row.id
      AND status = 'paid'
      AND NOT (
        COALESCE(method, '') <> 'mock'
        AND (provider_transaction_id IS NOT NULL OR pey_api_key_id IS NOT NULL)
      );

    DELETE FROM payments
    WHERE story_id = story_row.id
      AND status = 'paid'
      AND NOT (
        COALESCE(method, '') <> 'mock'
        AND (provider_transaction_id IS NOT NULL OR pey_api_key_id IS NOT NULL)
      );

    amounts := echale_round3_example_amounts(target, story_row.slug);
    used_companeros := false;
    used_familia := false;
    idx := 1;

    IF amounts IS NULL THEN
      CONTINUE;
    END IF;

    FOREACH amount IN ARRAY amounts LOOP
      IF amount = 5000 AND NOT used_companeros THEN
        donor := 'Compañeros de la obra';
        note := 'De parte de los compañeros de la obra.';
        used_companeros := true;
      ELSIF amount = 2000 AND NOT used_familia THEN
        donor := 'Familia Reyes';
        note := 'De parte de toda la familia.';
        used_familia := true;
      ELSIF story_row.slug = 'adrian' THEN
        donor := adrian_names[((idx - 1) % array_length(adrian_names, 1)) + 1];
        note := adrian_notes[((idx - 1) % array_length(adrian_notes, 1)) + 1];
      ELSIF idx % 6 = 0 THEN
        donor := 'Anónimo';
        note := NULL;
      ELSE
        donor := names[((idx - 1) % array_length(names, 1)) + 1];
        note := notes[((idx - 1) % array_length(notes, 1)) + 1];
      END IF;

      INSERT INTO payments (
        id, story_id, reference, pey_api_key_env, pey_api_key_id,
        provider_charge_id, provider_transaction_id, amount, donor_name, message,
        phone, concept, method, status, qr_string, payment_link,
        paid_at, released_at, created_at, updated_at
      ) VALUES (
        'example-r3-' || story_row.slug || '-' || idx,
        story_row.id,
        940000 + (CASE story_row.slug WHEN 'adrian' THEN 0 WHEN 'santiago' THEN 200 ELSE 400 END) + idx,
        story_row.pey_key_env,
        NULL,
        NULL,
        NULL,
        amount,
        donor,
        note,
        NULL,
        'Aporte de ejemplo',
        'mock',
        'paid',
        '{}',
        NULL,
        TIMESTAMPTZ '2026-11-13 16:00:00-06' - ((idx - 1) * INTERVAL '11 hours'),
        NULL,
        TIMESTAMPTZ '2026-11-13 16:00:00-06' - ((idx - 1) * INTERVAL '11 hours'),
        TIMESTAMPTZ '2026-11-13 16:00:00-06' - ((idx - 1) * INTERVAL '11 hours')
      );

      idx := idx + 1;
    END LOOP;

    SELECT COALESCE(SUM(payments.amount), 0) INTO inserted_sum
    FROM payments
    WHERE story_id = story_row.id
      AND id LIKE 'example-r3-%';

    IF round(inserted_sum, 2) <> round(target, 2) THEN
      RAISE EXCEPTION 'example total changed for % (before %, after %)', story_row.slug, target, inserted_sum;
    END IF;
  END LOOP;

  UPDATE payments
  SET
    donor_name = 'Matt (equipo Échale)',
    message = 'Prueba real de 1 centavo con CoDi. Sí llega.',
    updated_at = NOW()
  WHERE id LIKE '5e4f93c2%'
     OR (
       payments.amount = 0.01
       AND status = 'paid'
       AND COALESCE(method, '') <> 'mock'
       AND (provider_transaction_id IS NOT NULL OR pey_api_key_id IS NOT NULL)
     );
END;
$$;

DROP FUNCTION echale_round3_example_amounts(numeric, text);

COMMIT;
