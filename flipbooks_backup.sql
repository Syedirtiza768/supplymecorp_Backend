--
-- PostgreSQL database dump
--

\restrict FkBFapF7QzS8ttaKCF4KNgq0ldFLpjn7T8t73fk9CptfeWNUG9dqarAcpug1n0d

-- Dumped from database version 18.0
-- Dumped by pg_dump version 18.0

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.flipbook_pages DROP CONSTRAINT IF EXISTS "FK_flipbook_pages_flipbookId";
ALTER TABLE IF EXISTS ONLY public.flipbook_hotspots DROP CONSTRAINT IF EXISTS "FK_flipbook_hotspots_pageId";
DROP INDEX IF EXISTS public."IDX_flipbook_pages_flipbookId_pageNumber";
DROP INDEX IF EXISTS public."IDX_flipbook_hotspots_pageId";
ALTER TABLE IF EXISTS ONLY public.flipbooks DROP CONSTRAINT IF EXISTS flipbooks_pkey;
ALTER TABLE IF EXISTS ONLY public.flipbook_pages DROP CONSTRAINT IF EXISTS flipbook_pages_pkey;
ALTER TABLE IF EXISTS ONLY public.flipbook_hotspots DROP CONSTRAINT IF EXISTS flipbook_hotspots_pkey;
ALTER TABLE IF EXISTS ONLY public.flipbook_pages DROP CONSTRAINT IF EXISTS "UQ_flipbook_page";
DROP TABLE IF EXISTS public.flipbooks;
DROP TABLE IF EXISTS public.flipbook_pages;
DROP TABLE IF EXISTS public.flipbook_hotspots;
SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: flipbook_hotspots; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.flipbook_hotspots (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "pageId" uuid NOT NULL,
    "productSku" character varying(255),
    label character varying(255),
    "linkUrl" text,
    x double precision NOT NULL,
    y double precision NOT NULL,
    width double precision NOT NULL,
    height double precision NOT NULL,
    "zIndex" integer DEFAULT 0,
    meta jsonb,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: flipbook_pages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.flipbook_pages (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "flipbookId" character varying(255) NOT NULL,
    "pageNumber" integer NOT NULL,
    "imageUrl" text NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    meta jsonb
);


--
-- Name: flipbooks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.flipbooks (
    id character varying(255) DEFAULT public.uuid_generate_v4() NOT NULL,
    title character varying(255) NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    description text,
    "isFeatured" boolean DEFAULT false NOT NULL
);


--
-- Data for Name: flipbook_hotspots; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.flipbook_hotspots (id, "pageId", "productSku", label, "linkUrl", x, y, width, height, "zIndex", meta, "createdAt", "updatedAt") VALUES ('230298de-141c-4efe-9a1b-bf3b69608764', '1fe196e5-c4eb-4690-b5e7-6732f13f490d', '7675184', 'Bosch HD18-2 Hammer Drill, 8.5 A, Keyed Chuck, 1/2 in Chuck, 0 to 3200 rpm Speed', '/shop/7675184', 15.99250936329588, 47.71194364186302, 20, 15, 0, NULL, '2025-11-28 03:04:11.894', '2025-11-28 03:04:11.894');
INSERT INTO public.flipbook_hotspots (id, "pageId", "productSku", label, "linkUrl", x, y, width, height, "zIndex", meta, "createdAt", "updatedAt") VALUES ('3f8f7c0a-6567-40fe-96f7-76505d82cd13', '1fe196e5-c4eb-4690-b5e7-6732f13f490d', '7675184', 'Bosch HD18-2 Hammer Drill, 8.5 A, Keyed Chuck, 1/2 in Chuck, 0 to 3200 rpm Speed', '/shop/7675184', 44.157303370786515, 31.296815227169507, 27.94007490636704, 14.924538848518726, 1, NULL, '2025-11-28 03:06:32.159', '2025-11-28 03:06:32.159');
INSERT INTO public.flipbook_hotspots (id, "pageId", "productSku", label, "linkUrl", x, y, width, height, "zIndex", meta, "createdAt", "updatedAt") VALUES ('8d08193a-3408-45f1-bbe0-05cb8f34aa18', '1fe196e5-c4eb-4690-b5e7-6732f13f490d', '7691595', 'DEWALT DCD740C1 Drill/Driver Kit, Battery Included, 20 V, 3/8 in Chuck, Keyless, Ratcheting Chuck', '/shop/7691595', 7.677902621722846, 12.850753843884286, 24.9438202247191, 15.595304639463386, 2, NULL, '2025-11-28 03:25:32.899', '2025-11-28 03:25:32.899');
INSERT INTO public.flipbook_hotspots (id, "pageId", "productSku", label, "linkUrl", x, y, width, height, "zIndex", meta, "createdAt", "updatedAt") VALUES ('cbdbadc1-8429-4c98-9286-a813db419b90', '1fe196e5-c4eb-4690-b5e7-6732f13f490d', '7691595', 'DEWALT DCD740C1 Drill/Driver Kit, Battery Included, 20 V, 3/8 in Chuck, Keyless, Ratcheting Chuck', '/shop/7691595', 76.96629213483146, 29.843487982112915, 20, 15, 3, NULL, '2025-11-28 03:31:18.948', '2025-11-28 03:31:18.948');
INSERT INTO public.flipbook_hotspots (id, "pageId", "productSku", label, "linkUrl", x, y, width, height, "zIndex", meta, "createdAt", "updatedAt") VALUES ('a4252902-914a-4d36-bca5-a5e0a5f0d879', '1fe196e5-c4eb-4690-b5e7-6732f13f490d', '10413', 'DEWALT DW1583 Spade Drill Bit, 1-1/8 in Dia, 6 in OAL, 1/4 in Dia Shank, Hex Shank', '/shop/10413', 44.831460674157306, 48.75535748536658, 20, 15, 4, NULL, '2025-11-28 03:34:55.074', '2025-11-28 03:34:55.074');
INSERT INTO public.flipbook_hotspots (id, "pageId", "productSku", label, "linkUrl", x, y, width, height, "zIndex", meta, "createdAt", "updatedAt") VALUES ('0acc440e-393d-4b0e-a718-9f56f4ae4c5d', '8b84a5e6-82bc-4dc1-9976-b02a7b738244', '7691595', 'DEWALT DCD740C1 Drill/Driver Kit, Battery Included, 20 V, 3/8 in Chuck, Keyless, Ratcheting Chuck', '/shop/7691595', 10, 10.000000511753687, 90.0374531835206, 21.46450531022918, 0, NULL, '2025-11-27 19:55:40.689', '2025-11-27 19:55:40.689');
INSERT INTO public.flipbook_hotspots (id, "pageId", "productSku", label, "linkUrl", x, y, width, height, "zIndex", meta, "createdAt", "updatedAt") VALUES ('2ce4ce57-d49d-48a0-b6bf-5f970b0cebf9', '8b84a5e6-82bc-4dc1-9976-b02a7b738244', '7675184', 'Bosch HD18-2 Hammer Drill, 8.5 A, Keyed Chuck, 1/2 in Chuck, 0 to 3200 rpm Speed', '/shop/7675184', 9.700374531835205, 31.632198549103247, 90.3370786516854, 16.657350475125767, 1, NULL, '2025-11-27 19:57:17.662', '2025-11-27 19:57:17.662');
INSERT INTO public.flipbook_hotspots (id, "pageId", "productSku", label, "linkUrl", x, y, width, height, "zIndex", meta, "createdAt", "updatedAt") VALUES ('45014ae9-0cba-465b-8175-61f4376e2cf4', '8b84a5e6-82bc-4dc1-9976-b02a7b738244', '7853229', 'DEWALT DCD771C2 Drill/Driver Kit, Battery Included, 20 V, 1/2 in Chuck, Keyless Chuck', '/shop/7853229', 9.325842696629213, 48.28954689192199, 90.71161048689137, 16.880939072107324, 2, NULL, '2025-11-27 19:58:16.623', '2025-11-27 19:58:16.623');
INSERT INTO public.flipbook_hotspots (id, "pageId", "productSku", label, "linkUrl", x, y, width, height, "zIndex", meta, "createdAt", "updatedAt") VALUES ('c9b7d00e-325f-461a-9499-d197347e1aa7', '8b84a5e6-82bc-4dc1-9976-b02a7b738244', '7863236', 'Skil 9206-02 Reciprocating Saw, 7.5 A, 180 mm Cutting Capacity, 1-1/8 in L Stroke, 800 to 2700 spm', '/shop/7863236', 8.260635204529494, 65.44997682779311, 92.73408239700375, 13.415315818893237, 3, NULL, '2025-11-27 19:58:28.461', '2025-11-27 19:58:28.461');
INSERT INTO public.flipbook_hotspots (id, "pageId", "productSku", label, "linkUrl", x, y, width, height, "zIndex", meta, "createdAt", "updatedAt") VALUES ('6a21b79f-abe8-437b-a9e8-6284a38949ba', '8b84a5e6-82bc-4dc1-9976-b02a7b738244', '7805278', 'Makita MP100DWRX1 Inflator Kit, 12 V, 120 psi Pressure', '/shop/7805278', 7.153558052434457, 79.38327949229668, 92.88389513108615, 14.868641699273338, 4, NULL, '2025-11-27 19:59:57.114188', '2025-11-27 19:59:57.114188');
INSERT INTO public.flipbook_hotspots (id, "pageId", "productSku", label, "linkUrl", x, y, width, height, "zIndex", meta, "createdAt", "updatedAt") VALUES ('378731f4-84fe-4194-8c21-0623dbcd02a0', '0bb83f64-df4e-4e96-9e4d-96a332e2dca6', NULL, NULL, NULL, 10, 10, 20, 15, 0, NULL, '2025-11-28 02:57:49.201321', '2025-11-28 02:57:49.201321');


--
-- Data for Name: flipbook_pages; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.flipbook_pages (id, "flipbookId", "pageNumber", "imageUrl", "createdAt", "updatedAt", meta) VALUES ('0bb83f64-df4e-4e96-9e4d-96a332e2dca6', '2025-Spring-Summer-Catalogue', 1, '/uploads/flipbooks/2025-Spring-Summer-Catalogue/page-1.png', '2025-11-27 18:44:27.638181', '2025-11-27 18:44:27.638181', NULL);
INSERT INTO public.flipbook_pages (id, "flipbookId", "pageNumber", "imageUrl", "createdAt", "updatedAt", meta) VALUES ('8b84a5e6-82bc-4dc1-9976-b02a7b738244', '2025-Spring-Summer-Catalogue', 2, '/uploads/flipbooks/2025-Spring-Summer-Catalogue/page-2.png', '2025-11-27 18:44:47.475332', '2025-11-27 18:44:47.475332', NULL);
INSERT INTO public.flipbook_pages (id, "flipbookId", "pageNumber", "imageUrl", "createdAt", "updatedAt", meta) VALUES ('092e9a8f-56da-456c-8595-9e554f67bd12', '2025-Spring-Summer-Catalogue', 3, '/uploads/flipbooks/2025-Spring-Summer-Catalogue/page-3.png', '2025-11-27 18:45:15.992797', '2025-11-27 18:45:15.992797', NULL);
INSERT INTO public.flipbook_pages (id, "flipbookId", "pageNumber", "imageUrl", "createdAt", "updatedAt", meta) VALUES ('f91b17cb-e46b-4575-aad8-7f1b2e82a8e1', '2025-Spring-Summer-Catalogue', 4, '/uploads/flipbooks/2025-Spring-Summer-Catalogue/page-4.png', '2025-11-27 18:45:33.099784', '2025-11-27 18:45:33.099784', NULL);
INSERT INTO public.flipbook_pages (id, "flipbookId", "pageNumber", "imageUrl", "createdAt", "updatedAt", meta) VALUES ('c91354e1-63e7-4d84-9376-701dd522ebc5', '2025-Spring-Summer-Catalogue', 5, '/uploads/flipbooks/2025-Spring-Summer-Catalogue/page-5.png', '2025-11-27 18:45:49.086219', '2025-11-27 18:45:49.086219', NULL);
INSERT INTO public.flipbook_pages (id, "flipbookId", "pageNumber", "imageUrl", "createdAt", "updatedAt", meta) VALUES ('ef262179-2c50-4daf-b3b3-31e2a53c884a', '2025-Spring-Summer-Catalogue', 6, '/uploads/flipbooks/2025-Spring-Summer-Catalogue/page-6.png', '2025-11-27 18:46:43.676741', '2025-11-27 18:46:43.676741', NULL);
INSERT INTO public.flipbook_pages (id, "flipbookId", "pageNumber", "imageUrl", "createdAt", "updatedAt", meta) VALUES ('fbe1311c-9de9-4f7f-bdd6-134c18308c63', '2025-Spring-Summer-Catalogue', 7, '/uploads/flipbooks/2025-Spring-Summer-Catalogue/page-7.png', '2025-11-27 18:47:07.205502', '2025-11-27 18:47:07.205502', NULL);
INSERT INTO public.flipbook_pages (id, "flipbookId", "pageNumber", "imageUrl", "createdAt", "updatedAt", meta) VALUES ('87268939-7321-402f-a841-f7213af34739', '2025-26-Fall---Winter-Catalogue', 1, '/uploads/flipbooks/2025-26-Fall---Winter-Catalogue/page-1.webp', '2025-11-28 02:22:32.285294', '2025-11-28 02:22:32.285294', NULL);
INSERT INTO public.flipbook_pages (id, "flipbookId", "pageNumber", "imageUrl", "createdAt", "updatedAt", meta) VALUES ('1fe196e5-c4eb-4690-b5e7-6732f13f490d', '2025-26-Fall---Winter-Catalogue', 2, '/uploads/flipbooks/2025-26-Fall---Winter-Catalogue/page-2.webp', '2025-11-28 02:22:48.722252', '2025-11-28 02:22:48.722252', NULL);
INSERT INTO public.flipbook_pages (id, "flipbookId", "pageNumber", "imageUrl", "createdAt", "updatedAt", meta) VALUES ('fb9a921b-7f9d-4373-8d3c-0619a6819f8f', '2025-26-Fall---Winter-Catalogue', 3, '/uploads/flipbooks/2025-26-Fall---Winter-Catalogue/page-3.webp', '2025-11-28 02:23:13.155552', '2025-11-28 02:23:13.155552', NULL);
INSERT INTO public.flipbook_pages (id, "flipbookId", "pageNumber", "imageUrl", "createdAt", "updatedAt", meta) VALUES ('9e456116-6b6d-4b1d-96ea-1ee6ddfb661b', '2025-26-Fall---Winter-Catalogue', 4, '/uploads/flipbooks/2025-26-Fall---Winter-Catalogue/page-4.webp', '2025-11-28 02:23:38.810929', '2025-11-28 02:23:38.810929', NULL);
INSERT INTO public.flipbook_pages (id, "flipbookId", "pageNumber", "imageUrl", "createdAt", "updatedAt", meta) VALUES ('02814f35-4222-4187-bea5-becf8fe2b799', '2025-26-Fall---Winter-Catalogue', 5, '/uploads/flipbooks/2025-26-Fall---Winter-Catalogue/page-5.webp', '2025-11-28 02:30:20.803753', '2025-11-28 02:30:20.803753', NULL);
INSERT INTO public.flipbook_pages (id, "flipbookId", "pageNumber", "imageUrl", "createdAt", "updatedAt", meta) VALUES ('f5a12806-a99c-4764-a134-91c6adab1cd5', '2025-26-Fall---Winter-Catalogue', 6, '/uploads/flipbooks/2025-26-Fall---Winter-Catalogue/page-6.webp', '2025-11-28 02:30:39.391883', '2025-11-28 02:30:39.391883', NULL);
INSERT INTO public.flipbook_pages (id, "flipbookId", "pageNumber", "imageUrl", "createdAt", "updatedAt", meta) VALUES ('0ac4103b-955f-4b53-8be3-e18aa2c068c6', '2025-26-Fall---Winter-Catalogue', 7, '/uploads/flipbooks/2025-26-Fall---Winter-Catalogue/page-7.webp', '2025-11-28 02:30:55.882436', '2025-11-28 02:30:55.882436', NULL);


--
-- Data for Name: flipbooks; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.flipbooks (id, title, "createdAt", "updatedAt", description, "isFeatured") VALUES ('2026-Spring---Summer', '2026 Spring & Summer', '2025-11-24 18:47:52.950341', '2025-11-24 18:47:52.950341', '', false);
INSERT INTO public.flipbooks (id, title, "createdAt", "updatedAt", description, "isFeatured") VALUES ('2025-Spring-Summer-Catalogue', '2025/26 Fall & Winter Catalogue', '2025-11-21 12:37:52.42694', '2025-11-28 02:22:19.960786', '', false);
INSERT INTO public.flipbooks (id, title, "createdAt", "updatedAt", description, "isFeatured") VALUES ('2025-26-Fall---Winter-Catalogue', '2025/26 Fall & Winter Catalogue', '2025-11-28 02:22:12.542043', '2025-11-28 02:22:19.974435', '', true);


--
-- Name: flipbook_pages UQ_flipbook_page; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.flipbook_pages
    ADD CONSTRAINT "UQ_flipbook_page" UNIQUE ("flipbookId", "pageNumber");


--
-- Name: flipbook_hotspots flipbook_hotspots_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.flipbook_hotspots
    ADD CONSTRAINT flipbook_hotspots_pkey PRIMARY KEY (id);


--
-- Name: flipbook_pages flipbook_pages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.flipbook_pages
    ADD CONSTRAINT flipbook_pages_pkey PRIMARY KEY (id);


--
-- Name: flipbooks flipbooks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.flipbooks
    ADD CONSTRAINT flipbooks_pkey PRIMARY KEY (id);


--
-- Name: IDX_flipbook_hotspots_pageId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_flipbook_hotspots_pageId" ON public.flipbook_hotspots USING btree ("pageId");


--
-- Name: IDX_flipbook_pages_flipbookId_pageNumber; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_flipbook_pages_flipbookId_pageNumber" ON public.flipbook_pages USING btree ("flipbookId", "pageNumber");


--
-- Name: flipbook_hotspots FK_flipbook_hotspots_pageId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.flipbook_hotspots
    ADD CONSTRAINT "FK_flipbook_hotspots_pageId" FOREIGN KEY ("pageId") REFERENCES public.flipbook_pages(id) ON DELETE CASCADE;


--
-- Name: flipbook_pages FK_flipbook_pages_flipbookId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.flipbook_pages
    ADD CONSTRAINT "FK_flipbook_pages_flipbookId" FOREIGN KEY ("flipbookId") REFERENCES public.flipbooks(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict FkBFapF7QzS8ttaKCF4KNgq0ldFLpjn7T8t73fk9CptfeWNUG9dqarAcpug1n0d

