-- ─────────────────────────────────────────────────────────────────────────────
-- KAVAL — Migration Supabase : traduction anglaise des 47 légendes de photo
-- À coller dans : Supabase Dashboard > SQL Editor > New query > Run
--
-- Aucune des légendes ajoutées lors des migrations précédentes
-- (migrations_photos_*.sql, migrations_legendes_*.sql) n'avait de version
-- anglaise (point_images.legende_en) : l'app bascule donc toujours sur le
-- texte français même en mode EN. Ciblé par id (uuid) plutôt que
-- point_id+chemin pour plus de robustesse. "Cliché" traduit par
-- "Photograph by" ; "Collection/Album X, ANC/ANOM" laissés tels quels
-- (mêmes mots qu'en anglais, noms de fonds d'archives).
-- ─────────────────────────────────────────────────────────────────────────────

update point_images set legende_en = 'The H-shaped workshop building, with the forge in the foreground (24.60 m by 11.20 m) and, in the courtyard, the shed housing the main engine connected to the workshops by a line shaft. Photograph by Théotime Bray, ANOM.' where id = 'f9cc509c-14c5-412d-be2d-8e7cc282a6a5';

update point_images set legende_en = 'The H-shaped workshop building, north-west façade. Photograph by Théotime Bray, ANOM.' where id = '47679f16-6ba6-4c47-aef9-3c65513ff511';

update point_images set legende_en = 'Military guards'' clothing workshop. Photograph by Théotime Bray, ANOM.' where id = 'c3e4bcdb-9140-49f7-a3f5-4103fa33bbc5';

update point_images set legende_en = 'View of the bakery around 1872: the chimneys not yet extended, the access ramps not yet in use. In the foreground, photographer Ernest Robin poses in front of a pulley streetlamp. Robin album, Bernheim library.' where id = '9678975e-c333-4367-9958-e4710099ddb0';

update point_images set legende_en = 'The bakery around 1893, chimneys now extended. By the entrance: the distributor, a civilian employee, and a convict clerk holding the account book. Photograph by Théotime Bray, ANOM.' where id = '6a978b12-3bf7-42e5-a40c-ffde1f46585a';

update point_images set legende_en = 'Charles Macé and his guillotine, postcard. "Monsieur de Nou", the executioner, carried out 46 executions of transportees between 1877 and 1902. Max Shekleton collection.' where id = '1e355928-7886-4add-9df1-d2e5d141f84f';

update point_images set legende_en = 'The Central Camp, circa 1872: convicts leaving their cells before the work detail. "The penitentiary''s cells are built of stone [...] made even bleaker by the enormous bars [...]", Alexis Trinquet. Photograph by Ernest Robin, Bernheim library.' where id = 'b3994e3b-5bfb-4353-821a-975d1aa49edd';

update point_images set legende_en = 'The Île Nou brickworks: 220,000 bricks produced in 1885. Bricks stamped "AP", "Île Nou" or "Koé" (Dumbéa) can still be found today. Brun-Dequen album, ANC.' where id = '933392f9-d3bd-40ee-8089-7b18a73415c1';

update point_images set legende_en = 'General view of East Camp, circa 1900. In the foreground, the gardens supplying fresh vegetables for convicts and Penitentiary Administration staff. Demore album, ANC.' where id = '8a469a21-8061-4477-a934-a05a8bd2ad36';

update point_images set legende_en = 'Saint-Michel chapel at East Camp, circa 1980. Photograph, Marcel C. Pétron collection.' where id = '97f87d27-15ee-4508-8993-19978cabf6b3';

update point_images set legende_en = 'East Camp convicts working in the gardens under the watch of military guards. Louis Lagarde collection, ANC.' where id = 'a4a7c432-c16b-435c-bc8b-2dcfcbcdd96c';

update point_images set legende_en = 'East Camp with, in the foreground, the cellular prison, then, on the hill overlooking the camp, the commandant''s house. ANC collection.' where id = '7fd87dbd-f6fa-4e78-b47a-788565a42d08';

update point_images set legende_en = 'Saint-Thomas chapel around 1893, with its brick bell tower nearly 9 m high, in the style characteristic of the Penitentiary. Photograph by Théotime Bray, ANOM.' where id = 'dc2d18c9-e34b-47b0-9e9d-c3d2be20aa75';

update point_images set legende_en = 'In 1886, behind the commandant''s residence on Île Nou, near a well, a water tower was built. Photograph (detail), Kakou collection, ANC.' where id = '81269f52-c131-44a3-a4ae-8f40c229b861';

update point_images set legende_en = 'The Île Nou school combined the girls'' school, the boys'' school and the lodgings of the schoolmistress and schoolmaster, in a 33 m by 11 m building. Photograph by Léon Devambez, ANC.' where id = '4b6665e7-8d8f-457a-8ce1-a03dfed8b30e';

update point_images set legende_en = 'Alfalfa fields at North Farm. In 1885, cultivated land covered nearly 50 hectares, including 14 of alfalfa. Gaillard collection, ANC.' where id = 'ace5382e-5ee2-4b48-a427-6808473af2dc';

update point_images set legende_en = 'North Farm circa 1872. Photograph by Ernest Robin, Robin album, Bernheim library.' where id = '61e0e384-616e-4983-9f6f-1795c7b2b555';

update point_images set legende_en = 'North Farm in 1914, caption by Léon Mirabel, accountant of the Penitentiary Administration. Marie-Hélène Lafouge collection.' where id = '15e893f3-05db-479d-bff4-aebba3b6e579';

update point_images set legende_en = 'Crops at North Farm circa 1877. Photograph by Allan Hughan, State Library of NSW.' where id = '8635eacb-9cd4-4e5c-b997-775c11f4d3da';

update point_images set legende_en = 'The hospital cemetery on Île Nou, permanently cleared in 1989 and replaced by a car park. Musée Ernest Cognacq collection, Ubaud fund, Saint-Martin-de-Ré.' where id = '303fc86e-9629-4452-8672-c0bf1fcc6d27';

update point_images set legende_en = 'The perimeter wall and the laundry seen from outside the hospital; in the background, the site of one of the quarries used in its construction. Photograph by Théotime, Kakou collection, ANC.' where id = 'eb7dae4c-0893-49d1-ba6e-cc4004d2bb9b';

update point_images set legende_en = 'The hospital gardens. At the centre, the circular artificial pond where, as a child, Albert Ubaud used to go eel fishing. Brun-Bourguet album, ANC.' where id = '94f488d5-3f52-410b-951b-daacd943ed84';

update point_images set legende_en = 'Patients at the Île Nou hospital, around 1910. Louis Lagarde collection, ANC.' where id = 'e8edfea8-de39-432b-be1a-5ff702da4877';

update point_images set legende_en = 'The entrance to the Marais Hospital around 1914; guard Albert Pérault and his family. A heavy two-leaf wooden door has been added under the archway, with a wicket gate in the right-hand leaf. Demore album, ANC.' where id = 'f542a888-9cfc-4ac6-a5da-09b1528b97b7';

update point_images set legende_en = 'The avenue of coconut trees leading to the hospital. "A road, as wide as a boulevard, lined with magnificent coconut trees, a good kilometre long, crosses the island between two hills, from the central penitentiary to the main Transportation hospital, the Marais Hospital, situated by the sea...", Dr Grosperrin. Demore album, ANC.' where id = 'cb80bb9f-e71f-49d5-bc48-094ffde464a5';

update point_images set legende_en = 'The residence of the Île Nou commandant-in-chief, decked out for the national holiday, around 1893. In the foreground, the commandant''s quay and the English garden; on the right, the commandant''s pavilion. Photograph by Théotime Bray, ANOM (ANC).' where id = '15be8e3f-9b74-4b4a-a45c-77b4a3aa2cae';

update point_images set legende_en = 'The residence measures 27 m by 15 m, opening onto a vast English garden with a Caledonian touch (black wood trees, pandanus, orange trees, aloe vera), where several commandants-in-chief have stayed. In the foreground, an indigenous guard armed with a bird''s-beak war club and spears.' where id = 'c13035c7-6839-48c4-98a4-c3253d4e619a';

update point_images set legende_en = 'The main entrance, with its double staircase of dressed stone and its openwork cross-pattern balustrades; on the wall, ficus pumila, known locally as "ivy" in Caledonia. Photograph by Théotime Bray, circa 1893, ANOM (ANC).' where id = '829cc70b-a9dd-40c3-b0e6-dd08ef157801';

update point_images set legende_en = 'The vegetable garden of the asylum for the insane. Doctors considered it necessary to their therapy: it served to "occupy" and "distract" them. Photograph by Théotime Bray, Bray/Fayard collection.' where id = 'e2ac5170-2cde-4695-b193-d794e318e8a6';

update point_images set legende_en = 'The dairy farm in the cove of the same name on Île Nou. Construction of a watering trough. Photograph by Allan Hughan, State Library of NSW.' where id = '5296af74-4497-4d28-a751-ce02963f9dba';

update point_images set legende_en = 'Macé in front of his house at La Vacherie. "He lived in a neat little house [...] scraping by on the meagre income from this land", Jacques Dhur. Photograph by Théotime Bray, ANOM.' where id = '78f892d9-410e-4b13-9382-d6e5917e45ab';

update point_images set legende_en = 'Executioner Rieusset in front of his cabin at La Vacherie — the last serving executioners would later live on the hill above. Musée Ernest Cognacq collection, Ubaud fund, Saint-Martin-de-Ré.' where id = 'a281a5a8-9559-4111-ae5a-fd3cc31b4635';

update point_images set legende_en = 'The huts of the Pointe Kungu leper colony on Île Nou. Louis-Georges Viale collection.' where id = 'bec7518d-1eef-40bc-9ee3-6cd62c2be59e';

update point_images set legende_en = 'Lepers awaiting embarkation. "[...] the one standing in the middle of our photograph bears a few bloodless patches on his hands [...]", Dr Léon Collin, Léon Collin album, ANC.' where id = '8dd5c9ca-7204-4908-b06d-c3a731bf844e';

update point_images set legende_en = 'Leprous transportees at the Pointe Kungu leper colony.' where id = '188f3021-fd6d-4c17-ad64-2de4228e3bc7';

update point_images set legende_en = 'Head guard''s lodging. Photograph by Théotime Bray, ANOM.' where id = 'e3048f9d-fcb8-412d-aa84-bde273fc8064';

update point_images set legende_en = 'At the centre, by the quay lined with a wooden balustrade, the head guard''s lodging, now occupied by CREIPAC, which served as an infirmary in the 1950s-1960s. Photograph (detail), ANC collection.' where id = '6909154d-935c-4e79-8928-4102a842e418';

update point_images set legende_en = 'Built between 1877 and 1878, the married guards'' barracks (with its turreted roof) is raised above ground level, with cellars and cisterns underneath and a veranda at the front. Photograph by Théotime Bray, ANOM.' where id = 'a263ac58-25bf-46b4-8fa0-afed84260c7d';

update point_images set legende_en = 'Upstairs corridor of the married guards'' barracks. The doors, fitted with hatches, are — in Carol''s words — "dreadfully locked". Photograph by Dufty, Nicolas Hagen album, ANC.' where id = 'e98da317-4f5e-4b7e-b86e-a423353da8d4';

update point_images set legende_en = 'In the foreground, two indigenous guards in braided jackets, in front of the married guards'' barracks, with families posing on its balcony. Louis Lagarde collection, ANC.' where id = '47e9cbae-c4c4-4539-8a5b-2094cc814e88';

update point_images set legende_en = 'The married guards'' barracks and its outbuildings. Musée Ernest Cognacq collection, Ubaud fund, Saint-Martin-de-Ré.' where id = '7c53b78c-a8ab-4893-99e5-670f252fa75b';

update point_images set legende_en = 'At the rear, in a shared courtyard, two masonry outbuildings with sheet-metal roofs, 26 m long and 6 m wide, housed the kitchens. Photograph by Théotime Bray, ANOM.' where id = 'f061a533-a0d7-40ec-8335-d0204e45c8ef';

update point_images set legende_en = 'Small married guards'' barracks on Île Nou, circa 1893, on the harbour and Ducos side: under the flame trees, guards'' families (including the Brays) pose for the photograph. Among the oldest lodgings in the penitentiary, used until the end of the penal colony. Photograph by Théotime Bray, ANOM.' where id = 'b35f01f1-c7d9-4893-ac80-d592d1738c75';

update point_images set legende_en = 'Provisions store, accountant''s lodging and offices, west wing. Leloup album, Kakou collection, ANC.' where id = 'aceb40c1-a3b1-4f5c-8287-8e9146ae1598';

update point_images set legende_en = 'The coal yard, circa 1893: a shed from which a Decauville railway led to the coal-loading jetty, serving the needs of the administration and the fleet. Photograph by Théotime Bray, ANOM.' where id = '8377469a-d5ed-4a0f-b94f-f77a23a5c616';

update point_images set legende_en = 'Convicts on work detail wearing the coupling chain, in front of the East Camp coal yard. Photograph taken during the Protet campaign, 1899. Jacky Tronel collection, Histoire pénitentiaire et Justice militaire blog.' where id = 'eb638e96-fda7-4d60-88b3-e49e94c80f5c';

update point_images set legende_en = 'Convicts wearing the double chain at the coal yard worksite; the coal shed is damaged, with its roof and gutters partly missing. Rime album, ANC.' where id = '73f595eb-60d8-4052-9a34-419caad08a0e';
