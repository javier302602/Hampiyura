-- Ronda 20: "localidad" pasa de texto libre a una zona general fija (provincia, departamento). Los productos que ya tenían
-- texto libre se llevan a la zona correspondiente SOLO si el texto nombra con claridad una ciudad o provincia de la lista;
-- si solo dice un departamento, algo ambiguo o algo desconocido, queda "No especificado" (no se inventa una zona).
UPDATE "Producto" SET "localidad" = CASE
  WHEN translate(lower("localidad"), 'áéíóúñ', 'aeioun') ~ '(tingo maria|leoncio prado|rupa[- ]rupa)' THEN 'Leoncio Prado, Huánuco'
  WHEN translate(lower("localidad"), 'áéíóúñ', 'aeioun') ~ '(puerto inca|codo del pozuzo)' THEN 'Puerto Inca, Huánuco'
  WHEN translate(lower("localidad"), 'áéíóúñ', 'aeioun') ~ '(iquitos|maynas)' THEN 'Maynas, Loreto'
  WHEN translate(lower("localidad"), 'áéíóúñ', 'aeioun') ~ '(yurimaguas|alto amazonas)' THEN 'Alto Amazonas, Loreto'
  WHEN translate(lower("localidad"), 'áéíóúñ', 'aeioun') ~ '(pucallpa|coronel portillo|callería|calleria)' THEN 'Coronel Portillo, Ucayali'
  WHEN translate(lower("localidad"), 'áéíóúñ', 'aeioun') ~ '(aguaytia|padre abad)' THEN 'Padre Abad, Ucayali'
  WHEN translate(lower("localidad"), 'áéíóúñ', 'aeioun') ~ '(atalaya)' THEN 'Atalaya, Ucayali'
  WHEN translate(lower("localidad"), 'áéíóúñ', 'aeioun') ~ '(tarapoto|banda de shilcayo|morales)' THEN 'San Martín, San Martín'
  WHEN translate(lower("localidad"), 'áéíóúñ', 'aeioun') ~ '(moyobamba)' THEN 'Moyobamba, San Martín'
  WHEN translate(lower("localidad"), 'áéíóúñ', 'aeioun') ~ '(rioja)' THEN 'Rioja, San Martín'
  WHEN translate(lower("localidad"), 'áéíóúñ', 'aeioun') ~ '(tocache)' THEN 'Tocache, San Martín'
  WHEN translate(lower("localidad"), 'áéíóúñ', 'aeioun') ~ '(puerto maldonado|tambopata)' THEN 'Tambopata, Madre de Dios'
  WHEN translate(lower("localidad"), 'áéíóúñ', 'aeioun') ~ '(satipo)' THEN 'Satipo, Junín'
  WHEN translate(lower("localidad"), 'áéíóúñ', 'aeioun') ~ '(chanchamayo|la merced|san ramon|perene)' THEN 'Chanchamayo, Junín'
  WHEN translate(lower("localidad"), 'áéíóúñ', 'aeioun') ~ '(oxapampa|pozuzo|villa rica)' THEN 'Oxapampa, Pasco'
  WHEN translate(lower("localidad"), 'áéíóúñ', 'aeioun') ~ '(chachapoyas)' THEN 'Chachapoyas, Amazonas'
  WHEN translate(lower("localidad"), 'áéíóúñ', 'aeioun') ~ '(bagua)' THEN 'Bagua, Amazonas'
  WHEN translate(lower("localidad"), 'áéíóúñ', 'aeioun') ~ '(jaen)' THEN 'Jaén, Cajamarca'
  ELSE 'No especificado'
END
WHERE "localidad" NOT IN (
  'Bagua, Amazonas','Bongará, Amazonas','Chachapoyas, Amazonas','Condorcanqui, Amazonas','Luya, Amazonas','Rodríguez de Mendoza, Amazonas','Utcubamba, Amazonas',
  'Jaén, Cajamarca','San Ignacio, Cajamarca','La Convención, Cusco','Paucartambo, Cusco',
  'Ambo, Huánuco','Huánuco, Huánuco','Leoncio Prado, Huánuco','Pachitea, Huánuco','Puerto Inca, Huánuco','Yarowilca, Huánuco',
  'Chanchamayo, Junín','Satipo, Junín',
  'Alto Amazonas, Loreto','Datem del Marañón, Loreto','Loreto, Loreto','Mariscal Ramón Castilla, Loreto','Maynas, Loreto','Putumayo, Loreto','Requena, Loreto','Ucayali, Loreto',
  'Manu, Madre de Dios','Tahuamanu, Madre de Dios','Tambopata, Madre de Dios','Oxapampa, Pasco','Pasco, Pasco','Carabaya, Puno','Sandia, Puno',
  'Bellavista, San Martín','El Dorado, San Martín','Huallaga, San Martín','Lamas, San Martín','Mariscal Cáceres, San Martín','Moyobamba, San Martín','Picota, San Martín','Rioja, San Martín','San Martín, San Martín','Tocache, San Martín',
  'Atalaya, Ucayali','Coronel Portillo, Ucayali','Padre Abad, Ucayali','Purús, Ucayali','Otra zona (fuera de la lista)'
);
