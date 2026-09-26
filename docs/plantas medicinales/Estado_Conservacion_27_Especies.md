# HampiYura — Estado de conservación de las 27 plantas (Ronda 30)

Investigado con las mismas dos fuentes para las 27 especies: la **IUCN Red List** (categoría global) y el **Decreto Supremo N° 043-2006-AG** (lista oficial peruana de flora amenazada). Donde ninguna fuente tiene una evaluación real publicada, se marca explícitamente **"No evaluada"** — nunca se asume que una especie está "bien" solo porque es muy cultivada, ni que está "en riesgo" sin una fuente real.

**Limitación técnica honesta, igual que con las fotos de la Ronda 29:** en el entorno donde se hizo esta investigación, `iucnredlist.org` es una aplicación en JavaScript que bloquea la lectura directa, y los Anexos 1 y 2 del D.S. 043-2006-AG (las tablas reales de especies) no se pudieron leer completos en ningún PDF oficial probado — la mayoría de las conclusiones de "no encontrada en la lista peruana" se apoyan en búsquedas cruzadas amplias, no en una lectura línea por línea del anexo. **Antes de publicar esto como dato oficial permanente, sería bueno que alguien con acceso normal a internet confirme cada categoría directamente en iucnredlist.org** (para las marcadas aquí como confirmadas indirectamente) y, si es posible, consiga el PDF del anexo completo del decreto o corra el paquete de R `peruflorads43` (github.com/PaulESantos/peruflorads43, transcripción académica de las 776 especies del decreto).

## Tabla resumen

| # | Planta | IUCN Red List | Perú (D.S. 043-2006-AG) |
|---|---|---|---|
| 1 | Maíz — *Zea mays* | Preocupación Menor (LC), 2019 | No aparece |
| 2 | Café — *Coffea arabica* | **En Peligro (EN)**, 2020 — ojo: es sobre las poblaciones **silvestres** de Etiopía/Sudán del Sur (centro de origen), no sobre el café cultivado en el mundo | No aparece |
| 3 | Plátano — *Musa acuminata* | Preocupación Menor (LC), 2016/2017 | No aparece |
| 4 | Cacao — *Theobroma cacao* | **Datos Insuficientes (DD)** — no es lo mismo que "sin riesgo"; falta información sobre poblaciones silvestres amazónicas | No aparece |
| 5 | Palta — *Persea americana* | **No evaluada** — Wikipedia muestra "LC" sin ninguna cita real; no se encontró ficha verificable | No aparece |
| 6 | Guanábana — *Annona muricata* | Preocupación Menor (LC), 2018 | No aparece |
| 7 | Achiote — *Bixa orellana* | Preocupación Menor (LC), 2019 | No aparece |
| 8 | Menta — *Mentha × piperita* | No evaluada | No aparece |
| 9 | Eucalipto — *Eucalyptus globulus* | No evaluada / no encontrada | No aparece |
| 10 | Noni — *Morinda citrifolia* | Preocupación Menor (LC), 2024 | No aparece |
| 11 | Llantén — *Plantago major* | Preocupación Menor (LC), 2016 | No aparece |
| 12 | Sangre de grado — *Croton lechleri* | No evaluada | **No aparece esta especie exacta** — pero el decreto sí incluye 5 especies emparentadas con el mismo nombre común ("sangre de grado/sangre de drago") como **Casi Amenazado (NT)**: *C. draconoides, C. erythrochilus, C. palanostigma, C. perspeciosus, C. sampatik*. No usar el NT de esas especies para *C. lechleri* — son especies distintas vendidas bajo el mismo nombre popular. |
| 13 | Uña de gato — *Uncaria tomentosa* | No evaluada | No encontrada |
| 14 | Chanca piedra — *Phyllanthus niruri* | No evaluada | No encontrada |
| 15 | Chuchuhuasi — *Maytenus macrocarpa* (= *Monteverdia macrocarpa*) | Preocupación Menor (LC), 2019 | No encontrada |
| 16 | Huito — *Genipa americana* | Preocupación Menor (LC), 2021 | No encontrada |
| 17 | Jergón sacha — *Dracontium loretense* (= *D. spruceanum*) | No evaluada | No encontrada |
| 18 | Sacha inchi — *Plukenetia volubilis* | No evaluada | No encontrada |
| 19 | Camu camu — *Myrciaria dubia* | Preocupación Menor (LC), 2019 (confirmación indirecta vía cita de Wikipedia, no lectura directa de iucnredlist.org) | No encontrada |
| 20 | Mucura — *Petiveria alliacea* | No evaluada (solo tiene estatus "Secure" de NatureServe, que no es IUCN) | No encontrada |
| 21 | Copaiba — *Copaifera* spp. (paupera/officinalis/reticulata) | **No evaluada** — a pesar de la sobreexplotación documentada por incisión repetida del tronco. (Ojo: existe LC para *Copaifera langsdorffii*, pero es una especie distinta, no la de esta ficha — no usarla como sustituto) | No encontrada |
| 22 | Ojé — *Ficus insipida* | **Contradicción sin resolver, no publicar como hecho:** el recuadro de Wikipedia cita LC (2019), pero el cuerpo del mismo artículo dice que a 2021 no ha sido evaluada por IUCN. Confirmar manualmente en iucnredlist.org antes de mostrar cualquier categoría. | No encontrada |
| 23 | Matico — *Piper aduncum* | No evaluada | No encontrada |
| 24 | **Hercampuri — *Gentianella alborosea*** | **En Peligro (EN)** | **Peligro Crítico (CR)** — confirmado textualmente en la Ficha Técnica Hercampuri de PromPerú (repositorio.promperu.gob.pe/bitstreams/c7058f3d-40b5-4c2e-bf7e-ff969c209165/download). **Es la especie con el riesgo real más alto de las 27.** |
| 25 | Yacón — *Smallanthus sonchifolius* | No evaluada (solo existe evaluación de un congénere distinto, *S. glabratus*) | No encontrada |
| 26 | Guayusa — *Ilex guayusa* | Preocupación Menor (LC) | No encontrada |
| 27 | Ajo sacha — *Mansoa alliacea* | No evaluada | No encontrada |

## La única planta realmente en peligro confirmado: Hercampuri

De las 27, **Hercampuri es la única con una categoría de riesgo alta confirmada en dos fuentes independientes**: "En Peligro" (IUCN) y "Peligro Crítico" (lista oficial peruana). Es la que debería destacarse en el inicio como ejemplo de planta que la gente debería cuidar más — con la aclaración honesta ya presente en su ficha (Ronda 29) de que es una especie altoandina, no amazónica de tierras bajas, y que en la selva se comercializa, no se cultiva localmente.

Como nota secundaria (no un "en peligro" para destacar en portada, pero vale mencionar en su ficha): Sangre de grado se vende comercialmente bajo un nombre popular que en Perú cubre varias especies del género *Croton*, y 5 de esas especies emparentadas sí están catalogadas Casi Amenazado — conviene que la ficha de Sangre de grado lo mencione como aviso de identidad, igual que ya se hace con Hercampuri/Gentianella.
