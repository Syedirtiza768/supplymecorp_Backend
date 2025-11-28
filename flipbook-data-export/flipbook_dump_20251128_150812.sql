--
-- PostgreSQL database dump
--

\restrict X8Wa4vZSWbe1WvSkB10lZdYtNlDvukdWJy1cp2tGRpcBXbiVzXqab6cA1HkRiXh

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: flipbook_hotspots; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.flipbook_hotspots OWNER TO postgres;

--
-- Name: flipbook_pages; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.flipbook_pages OWNER TO postgres;

--
-- Name: flipbooks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.flipbooks (
    id character varying(255) DEFAULT public.uuid_generate_v4() NOT NULL,
    title character varying(255) NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    description text,
    "isFeatured" boolean DEFAULT false NOT NULL
);


ALTER TABLE public.flipbooks OWNER TO postgres;

--
-- Data for Name: flipbook_hotspots; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.flipbook_hotspots VALUES ('b1daa085-8081-40e3-ac55-eb0d5e4fdadb', '9e456116-6b6d-4b1d-96ea-1ee6ddfb661b', '8635583', 'Hydroflector 398HKP-M Gloves, Men''s, M, Keystone Thumb, Easy-On Cuff, Cowhide Leather, Tan', '/shop/8635583', 5.755395683453238, 10.017920736770904, 44.12470023980815, 29.749103942652326, 0, NULL, '2025-11-28 12:13:58.84', '2025-11-28 07:13:58.84');
INSERT INTO public.flipbook_hotspots VALUES ('6533dbc4-9db4-4322-9343-2e4f1533ea52', '9e456116-6b6d-4b1d-96ea-1ee6ddfb661b', '8635542', 'Hydroflector 350HKP-M Gloves, Men''s, M, Keystone Thumb, Knit Wrist Cuff, Cowhide Leather, Gold', '/shop/8635542', 51.07913669064749, 10.10752681335668, 40.28776978417266, 30.734767025089603, 1, NULL, '2025-11-28 12:14:27.208', '2025-11-28 07:14:27.208');
INSERT INTO public.flipbook_hotspots VALUES ('98a17d0e-3827-40ad-995f-268aa89c165b', '9e456116-6b6d-4b1d-96ea-1ee6ddfb661b', '8635583', 'Hydroflector 398HKP-M Gloves, Men''s, M, Keystone Thumb, Easy-On Cuff, Cowhide Leather, Tan', '/shop/8635583', 52.27817745803357, 42.00717009951137, 42.68585131894484, 28.136200716845877, 2, NULL, '2025-11-28 12:21:53.591', '2025-11-28 07:21:53.591');
INSERT INTO public.flipbook_hotspots VALUES ('31533dee-c7c6-4f69-a614-47220e67d50b', '9e456116-6b6d-4b1d-96ea-1ee6ddfb661b', '8635450', 'KincoPro 2014HK-M Driver Gloves, Men''s, M, Easy-On, Shirred Elastic Wrist Cuff, TPR Back, Brown', '/shop/8635450', 6.115107913669065, 40.66308407800599, 42.565947242206235, 29.121863799283155, 3, NULL, '2025-11-28 13:35:39.535', '2025-11-28 08:35:39.535');
INSERT INTO public.flipbook_hotspots VALUES ('912f09d3-1611-4d50-81c0-f0aa72c492e8', '9e456116-6b6d-4b1d-96ea-1ee6ddfb661b', '8635500', 'KincoPro 3102HKP-L Safety Gloves, Men''s, L, Wing Thumb, Easy-On Cuff, Polyester/Spandex Back, Black/Gold', '/shop/8635500', 6.235011990407674, 70.6451634779626, 42.565947242206235, 29.39068100358423, 4, NULL, '2025-11-28 13:36:09.275', '2025-11-28 08:36:09.275');
INSERT INTO public.flipbook_hotspots VALUES ('b791d739-8255-4581-9384-91eef9edd59b', '9e456116-6b6d-4b1d-96ea-1ee6ddfb661b', '8635625', 'Kinco 903HK-XL Gloves, Men''s, XL, Keystone Thumb, Easy-On Cuff, Deerskin Leather, Gold, Lined', '/shop/8635625', 53.71702637889688, 70.48387424920195, 41.726618705035975, 27.688172043010752, 5, NULL, '2025-11-28 13:36:39.321436', '2025-11-28 08:36:39.321');
INSERT INTO public.flipbook_hotspots VALUES ('0acc440e-393d-4b0e-a718-9f56f4ae4c5d', '8b84a5e6-82bc-4dc1-9976-b02a7b738244', '7691595', 'DEWALT DCD740C1 Drill/Driver Kit, Battery Included, 20 V, 3/8 in Chuck, Keyless, Ratcheting Chuck', '/shop/7691595', 10, 10.000000511753687, 90.0374531835206, 21.46450531022918, 0, NULL, '2025-11-27 19:55:40.689', '2025-11-27 14:55:40.689');
INSERT INTO public.flipbook_hotspots VALUES ('2ce4ce57-d49d-48a0-b6bf-5f970b0cebf9', '8b84a5e6-82bc-4dc1-9976-b02a7b738244', '7675184', 'Bosch HD18-2 Hammer Drill, 8.5 A, Keyed Chuck, 1/2 in Chuck, 0 to 3200 rpm Speed', '/shop/7675184', 9.700374531835205, 31.632198549103247, 90.3370786516854, 16.657350475125767, 1, NULL, '2025-11-27 19:57:17.662', '2025-11-27 14:57:17.662');
INSERT INTO public.flipbook_hotspots VALUES ('45014ae9-0cba-465b-8175-61f4376e2cf4', '8b84a5e6-82bc-4dc1-9976-b02a7b738244', '7853229', 'DEWALT DCD771C2 Drill/Driver Kit, Battery Included, 20 V, 1/2 in Chuck, Keyless Chuck', '/shop/7853229', 9.325842696629213, 48.28954689192199, 90.71161048689137, 16.880939072107324, 2, NULL, '2025-11-27 19:58:16.623', '2025-11-27 14:58:16.623');
INSERT INTO public.flipbook_hotspots VALUES ('c9b7d00e-325f-461a-9499-d197347e1aa7', '8b84a5e6-82bc-4dc1-9976-b02a7b738244', '7863236', 'Skil 9206-02 Reciprocating Saw, 7.5 A, 180 mm Cutting Capacity, 1-1/8 in L Stroke, 800 to 2700 spm', '/shop/7863236', 8.260635204529494, 65.44997682779311, 92.73408239700375, 13.415315818893237, 3, NULL, '2025-11-27 19:58:28.461', '2025-11-27 14:58:28.461');
INSERT INTO public.flipbook_hotspots VALUES ('6a21b79f-abe8-437b-a9e8-6284a38949ba', '8b84a5e6-82bc-4dc1-9976-b02a7b738244', '7805278', 'Makita MP100DWRX1 Inflator Kit, 12 V, 120 psi Pressure', '/shop/7805278', 7.153558052434457, 79.38327949229668, 92.88389513108615, 14.868641699273338, 4, NULL, '2025-11-27 19:59:57.114188', '2025-11-27 14:59:57.114');
INSERT INTO public.flipbook_hotspots VALUES ('378731f4-84fe-4194-8c21-0623dbcd02a0', '0bb83f64-df4e-4e96-9e4d-96a332e2dca6', NULL, NULL, NULL, 10, 10, 20, 15, 0, NULL, '2025-11-28 02:57:49.201321', '2025-11-27 21:57:49.201');
INSERT INTO public.flipbook_hotspots VALUES ('daf9c166-ce8b-49f1-9eeb-758f3a37de42', 'fb9a921b-7f9d-4373-8d3c-0619a6819f8f', '8394389', 'Troy-Bilt High Lift 490-110-M143 2-in-1 Standard Blade Set, 18.67 in L', '/shop/8394389', 10.071942446043165, 23.512544939594886, 19.18465227817746, 56.89964089342343, 0, NULL, '2025-11-28 11:37:30.161', '2025-11-28 06:37:30.161');
INSERT INTO public.flipbook_hotspots VALUES ('b045825e-e339-43ca-b5ec-c255c17c9c42', 'fb9a921b-7f9d-4373-8d3c-0619a6819f8f', '8394397', 'Troy-Bilt High Lift 490-110-M155 2-in-1 Standard Blade Set, 17.3 in L', '/shop/8394397', 31.654676258992804, 23.333333299151455, 32.014388489208635, 57.25806673795092, 1, NULL, '2025-11-28 11:37:30.161', '2025-11-28 06:37:30.161');
INSERT INTO public.flipbook_hotspots VALUES ('f8e1957d-2230-406c-b645-6da4198a5b07', 'fb9a921b-7f9d-4373-8d3c-0619a6819f8f', '8394371', 'Arnold 490-110-M126 High-Lift Blade Set, 17-1/4 in L, For: 50 in Zero Turn Garden Tractors', '/shop/8394371', 66.30695443645084, 23.51254476868551, 25.77937649880096, 57.34767247271794, 2, NULL, '2025-11-28 11:37:30.161', '2025-11-28 06:37:30.161');
INSERT INTO public.flipbook_hotspots VALUES ('da263562-fed3-46f5-8fec-f613beb0b2a7', 'f5a12806-a99c-4764-a134-91c6adab1cd5', '4218590', 'Wiremold NM910 Raceway Accessory Pack, Non-Metallic, Plastic, Ivory', '/shop/4218590', 2.5179856115107913, 21.308243659234815, 46.882494004796165, 35.483870967741936, 0, NULL, '2025-11-28 13:41:27.996', '2025-11-28 08:41:27.996');
INSERT INTO public.flipbook_hotspots VALUES ('920dae27-50ca-4905-a8bb-2be962394099', 'f5a12806-a99c-4764-a134-91c6adab1cd5', '4218574', 'Wiremold NM8 Raceway Outside Elbow, Non-Metallic, Plastic, Ivory', '/shop/4218574', 50.59952038369304, 21.39784939400184, 47.24220623501199, 35.39426523297491, 1, NULL, '2025-11-28 13:41:49.417', '2025-11-28 08:41:49.417');
INSERT INTO public.flipbook_hotspots VALUES ('56846a5f-e83c-40f3-afac-0936410ceedf', 'f5a12806-a99c-4764-a134-91c6adab1cd5', '4218632', 'Wiremold NM11 Raceway T-Fitting, Plastic, Ivory', '/shop/4218632', 3.357314148681055, 60.96774138857387, 46.52278177458034, 36.29032258064516, 2, NULL, '2025-11-28 13:42:40.395855', '2025-11-28 08:42:40.395');
INSERT INTO public.flipbook_hotspots VALUES ('164fc544-c4f4-4cc1-8947-e128d9ca899f', 'f5a12806-a99c-4764-a134-91c6adab1cd5', '4218509', 'Wiremold NM7 Raceway Inside Elbow, Non-Metallic, Plastic, Ivory', '/shop/4218509', 51.199040767386094, 61.23655859287494, 45.32374100719424, 35.483870967741936, 3, NULL, '2025-11-28 13:42:40.395855', '2025-11-28 08:42:40.395');
INSERT INTO public.flipbook_hotspots VALUES ('07e28546-54ad-4877-b0a9-1693f91c5958', '0ac4103b-955f-4b53-8be3-e18aa2c068c6', '6247613', 'Master Flow SSB960A Roof Louver, 18 in L, 20-1/2 in W, Aluminum, Mill', '/shop/6247613', 3.357314148681055, 11.272401365328006, 46.882494004796165, 22.939068100358423, 0, NULL, '2025-11-28 13:43:09.139', '2025-11-28 08:43:09.139');
INSERT INTO public.flipbook_hotspots VALUES ('a21b512f-c7a0-458d-b564-023479f38efb', '0ac4103b-955f-4b53-8be3-e18aa2c068c6', '6247670', 'Master Flow RT65G Roof Louver, 18-1/2 in L, 18 in W, Resin, Gray', '/shop/6247670', 51.55875299760192, 11.451612834862056, 47.00239808153477, 22.401433691756274, 1, NULL, '2025-11-28 13:46:20.047056', '2025-11-28 08:46:20.047');
INSERT INTO public.flipbook_hotspots VALUES ('9cc542b4-0655-40fc-bfff-ac934f31c35a', '0ac4103b-955f-4b53-8be3-e18aa2c068c6', '6247688', 'Master Flow RT65BR Roof Louver, 18-1/2 in L, 18 in W, Resin, Brown', '/shop/6247688', 3.357314148681055, 35.01792107858965, 48.08153477218225, 20.340501792114697, 2, NULL, '2025-11-28 13:46:20.047056', '2025-11-28 08:46:20.047');
INSERT INTO public.flipbook_hotspots VALUES ('89b01d3f-c12d-4de7-b242-dd3922cc8f07', '0ac4103b-955f-4b53-8be3-e18aa2c068c6', '6247670', 'Master Flow RT65G Roof Louver, 18-1/2 in L, 18 in W, Resin, Gray', '/shop/6247670', 52.757793764988016, 34.65949813952155, 42.326139088729015, 20.25089605734767, 3, NULL, '2025-11-28 13:46:20.047056', '2025-11-28 08:46:20.047');
INSERT INTO public.flipbook_hotspots VALUES ('31637391-ddb5-4f58-975f-dfe46c3e0b6f', '0ac4103b-955f-4b53-8be3-e18aa2c068c6', '6247647', 'Master Flow SSB960AWW Roof Louver, 18 in L, 20-1/2 in W, Aluminum, Weathered Wood', '/shop/6247647', 4.316546762589928, 56.12903444570453, 45.08393285371702, 21.057347670250895, 4, NULL, '2025-11-28 13:46:20.047056', '2025-11-28 08:46:20.047');
INSERT INTO public.flipbook_hotspots VALUES ('59174578-fa17-46ee-b8a7-652f5e9f2f45', '0ac4103b-955f-4b53-8be3-e18aa2c068c6', '6247654', 'Master Flow SSB960AW Louver, 18 in L, 20-1/2 in W, Aluminum, White, Roof Installation', '/shop/6247654', 52.27817745803357, 56.666666119756655, 43.16546762589928, 19.982078853046595, 5, NULL, '2025-11-28 13:46:20.047056', '2025-11-28 08:46:20.047');
INSERT INTO public.flipbook_hotspots VALUES ('c74404a9-c900-43d8-85ab-a90b9c833662', '0ac4103b-955f-4b53-8be3-e18aa2c068c6', '6247688', 'Master Flow RT65BR Roof Louver, 18-1/2 in L, 18 in W, Resin, Brown', '/shop/6247688', 4.07673860911271, 77.99283372885864, 44.60431654676259, 21.32616487455197, 6, NULL, '2025-11-28 13:46:20.047056', '2025-11-28 08:46:20.047');
INSERT INTO public.flipbook_hotspots VALUES ('8c9156f8-4f33-4171-a022-49ed86b07ea9', '0ac4103b-955f-4b53-8be3-e18aa2c068c6', '6247688', 'Master Flow RT65BR Roof Louver, 18-1/2 in L, 18 in W, Resin, Brown', '/shop/6247688', 50.35971223021583, 78.08243946362568, 47.122302158273385, 21.863799283154123, 7, NULL, '2025-11-28 13:46:20.047056', '2025-11-28 08:46:20.047');
INSERT INTO public.flipbook_hotspots VALUES ('108037ad-8e1d-4ddf-98fe-37c2bf91275a', '02814f35-4222-4187-bea5-becf8fe2b799', '2018257', 'STAIN&SEALER SOLID WHT BASE 1G', '/shop/2018257', 29.25659472422063, 27.992831507036765, 20.863309352517987, 32.70609318996416, 1, NULL, '2025-11-28 13:52:30.069003', '2025-11-28 08:52:30.069');
INSERT INTO public.flipbook_hotspots VALUES ('692efe10-dd42-475b-bff1-219733af21c7', '02814f35-4222-4187-bea5-becf8fe2b799', '2018224', 'STN&SEALER SM-TRNSP NEUT BS 5G', '/shop/2018224', 36.810551558753, 62.043010205778174, 28.41726618705036, 34.13978494623656, 1, NULL, '2025-11-28 13:52:30.069003', '2025-11-28 08:52:30.069');
INSERT INTO public.flipbook_hotspots VALUES ('278ce541-d82c-465b-bb22-3ff2ca08802e', '1fe196e5-c4eb-4690-b5e7-6732f13f490d', '7691595', 'DEWALT DCD740C1 Drill/Driver Kit, Battery Included, 20 V, 3/8 in Chuck, Keyless, Ratcheting Chuck', '/shop/7691595', 8.15347721822542, 14.283153574953797, 28.65707434052758, 16.666666666666664, 0, NULL, '2025-11-28 11:49:07.391', '2025-11-28 06:49:07.391');
INSERT INTO public.flipbook_hotspots VALUES ('5165f8e9-7a37-423d-908e-26446af0469f', '1fe196e5-c4eb-4690-b5e7-6732f13f490d', '7863236', 'Skil 9206-02 Reciprocating Saw, 7.5 A, 180 mm Cutting Capacity, 1-1/8 in L Stroke, 800 to 2700 spm', '/shop/7863236', 9.59232613908873, 64.76702536306074, 32.25419664268585, 12.455197132616487, 1, NULL, '2025-11-28 11:51:22.59', '2025-11-28 06:51:22.59');
INSERT INTO public.flipbook_hotspots VALUES ('3ef557e6-c7f2-4655-92d9-bb6149a912ce', '1fe196e5-c4eb-4690-b5e7-6732f13f490d', '7675184', 'Bosch HD18-2 Hammer Drill, 8.5 A, Keyed Chuck, 1/2 in Chuck, 0 to 3200 rpm Speed', '/shop/7675184', 8.273381294964029, 32.68817231646575, 29.136690647482016, 14.78494623655914, 2, NULL, '2025-11-28 11:58:47.956', '2025-11-28 06:58:47.956');
INSERT INTO public.flipbook_hotspots VALUES ('6e8b28ef-de80-4c30-848c-946a2ff9e0a8', '1fe196e5-c4eb-4690-b5e7-6732f13f490d', '7853229', 'DEWALT DCD771C2 Drill/Driver Kit, Battery Included, 20 V, 1/2 in Chuck, Keyless Chuck', '/shop/7853229', 9.712230215827338, 79.19354729327677, 33.21342925659472, 15.412186379928317, 3, NULL, '2025-11-28 12:04:24.308', '2025-11-28 07:04:24.308');
INSERT INTO public.flipbook_hotspots VALUES ('7eadb0aa-2363-4d33-b283-5f2522639f4f', '1fe196e5-c4eb-4690-b5e7-6732f13f490d', '7853229', 'DEWALT DCD771C2 Drill/Driver Kit, Battery Included, 20 V, 1/2 in Chuck, Keyless Chuck', '/shop/7853229', 8.633093525179856, 48.36917726797015, 32.014388489208635, 14.96415770609319, 4, NULL, '2025-11-28 13:17:27.889', '2025-11-28 08:17:27.889');
INSERT INTO public.flipbook_hotspots VALUES ('ea6f2e24-2a82-42bf-968f-3ce2e98ba111', '1fe196e5-c4eb-4690-b5e7-6732f13f490d', '7691595', 'DEWALT DCD740C1 Drill/Driver Kit, Battery Included, 20 V, 3/8 in Chuck, Keyless, Ratcheting Chuck', '/shop/7691595', 8.15347721822542, 14.283153574953797, 28.65707434052758, 16.666666666666664, 0, NULL, '2025-11-28 11:49:07.391', '2025-11-28 06:49:07.391');
INSERT INTO public.flipbook_hotspots VALUES ('56a9a2a4-007c-4b97-80f6-8008b4832bc9', '1fe196e5-c4eb-4690-b5e7-6732f13f490d', '7863236', 'Skil 9206-02 Reciprocating Saw, 7.5 A, 180 mm Cutting Capacity, 1-1/8 in L Stroke, 800 to 2700 spm', '/shop/7863236', 9.59232613908873, 64.76702536306074, 32.25419664268585, 12.455197132616487, 1, NULL, '2025-11-28 11:51:22.59', '2025-11-28 06:51:22.59');
INSERT INTO public.flipbook_hotspots VALUES ('55809a0d-9d68-477c-a64e-378debefc2d6', '1fe196e5-c4eb-4690-b5e7-6732f13f490d', '7675184', 'Bosch HD18-2 Hammer Drill, 8.5 A, Keyed Chuck, 1/2 in Chuck, 0 to 3200 rpm Speed', '/shop/7675184', 8.273381294964029, 32.68817231646575, 29.136690647482016, 14.78494623655914, 2, NULL, '2025-11-28 11:58:47.956', '2025-11-28 06:58:47.956');
INSERT INTO public.flipbook_hotspots VALUES ('2482b04f-3bcd-4fa9-930d-4b6402096435', '1fe196e5-c4eb-4690-b5e7-6732f13f490d', '7853229', 'DEWALT DCD771C2 Drill/Driver Kit, Battery Included, 20 V, 1/2 in Chuck, Keyless Chuck', '/shop/7853229', 9.712230215827338, 79.19354729327677, 33.21342925659472, 15.412186379928317, 3, NULL, '2025-11-28 12:04:24.308', '2025-11-28 07:04:24.308');
INSERT INTO public.flipbook_hotspots VALUES ('433685cb-53c5-4447-8599-f33d12563343', '1fe196e5-c4eb-4690-b5e7-6732f13f490d', '7853229', 'DEWALT DCD771C2 Drill/Driver Kit, Battery Included, 20 V, 1/2 in Chuck, Keyless Chuck', '/shop/7853229', 8.633093525179856, 48.36917726797015, 32.014388489208635, 14.96415770609319, 4, NULL, '2025-11-28 13:17:27.889', '2025-11-28 08:17:27.889');
INSERT INTO public.flipbook_hotspots VALUES ('d32940f7-1bea-4af6-a77f-c80212f64719', '1fe196e5-c4eb-4690-b5e7-6732f13f490d', '7691595', 'DEWALT DCD740C1 Drill/Driver Kit, Battery Included, 20 V, 3/8 in Chuck, Keyless, Ratcheting Chuck', '/shop/7691595', 8.15347721822542, 14.283153574953797, 28.65707434052758, 16.666666666666664, 0, NULL, '2025-11-28 11:49:07.391', '2025-11-28 06:49:07.391');
INSERT INTO public.flipbook_hotspots VALUES ('22592bf4-f12f-4bc7-a4e9-109a4dbc93a4', '1fe196e5-c4eb-4690-b5e7-6732f13f490d', '7863236', 'Skil 9206-02 Reciprocating Saw, 7.5 A, 180 mm Cutting Capacity, 1-1/8 in L Stroke, 800 to 2700 spm', '/shop/7863236', 9.59232613908873, 64.76702536306074, 32.25419664268585, 12.455197132616487, 1, NULL, '2025-11-28 11:51:22.59', '2025-11-28 06:51:22.59');
INSERT INTO public.flipbook_hotspots VALUES ('063fe70d-6f8c-4dd8-b422-ed263295eb6a', '1fe196e5-c4eb-4690-b5e7-6732f13f490d', '7675184', 'Bosch HD18-2 Hammer Drill, 8.5 A, Keyed Chuck, 1/2 in Chuck, 0 to 3200 rpm Speed', '/shop/7675184', 8.273381294964029, 32.68817231646575, 29.136690647482016, 14.78494623655914, 2, NULL, '2025-11-28 11:58:47.956', '2025-11-28 06:58:47.956');
INSERT INTO public.flipbook_hotspots VALUES ('84987e38-dc5b-4b4c-a323-64d23068a507', '1fe196e5-c4eb-4690-b5e7-6732f13f490d', '7853229', 'DEWALT DCD771C2 Drill/Driver Kit, Battery Included, 20 V, 1/2 in Chuck, Keyless Chuck', '/shop/7853229', 9.712230215827338, 79.19354729327677, 33.21342925659472, 15.412186379928317, 3, NULL, '2025-11-28 12:04:24.308', '2025-11-28 07:04:24.308');
INSERT INTO public.flipbook_hotspots VALUES ('8b9aaaaa-3b09-4c2f-8747-4de8d9f74e1e', '1fe196e5-c4eb-4690-b5e7-6732f13f490d', '7853229', 'DEWALT DCD771C2 Drill/Driver Kit, Battery Included, 20 V, 1/2 in Chuck, Keyless Chuck', '/shop/7853229', 8.633093525179856, 48.36917726797015, 32.014388489208635, 14.96415770609319, 4, NULL, '2025-11-28 13:17:27.889', '2025-11-28 08:17:27.889');
INSERT INTO public.flipbook_hotspots VALUES ('f4e8fdf5-8929-42a3-b612-b2319d2d4d40', '1fe196e5-c4eb-4690-b5e7-6732f13f490d', '7691595', 'DEWALT DCD740C1 Drill/Driver Kit, Battery Included, 20 V, 3/8 in Chuck, Keyless, Ratcheting Chuck', '/shop/7691595', 8.15347721822542, 14.283153574953797, 28.65707434052758, 16.666666666666664, 0, NULL, '2025-11-28 11:49:07.391', '2025-11-28 06:49:07.391');
INSERT INTO public.flipbook_hotspots VALUES ('0ab548ba-15a2-4c4a-abc4-a0531c8f6beb', '1fe196e5-c4eb-4690-b5e7-6732f13f490d', '7863236', 'Skil 9206-02 Reciprocating Saw, 7.5 A, 180 mm Cutting Capacity, 1-1/8 in L Stroke, 800 to 2700 spm', '/shop/7863236', 9.59232613908873, 64.76702536306074, 32.25419664268585, 12.455197132616487, 1, NULL, '2025-11-28 11:51:22.59', '2025-11-28 06:51:22.59');
INSERT INTO public.flipbook_hotspots VALUES ('906abcfa-e68f-417d-bd58-dfeb32789958', '1fe196e5-c4eb-4690-b5e7-6732f13f490d', '7675184', 'Bosch HD18-2 Hammer Drill, 8.5 A, Keyed Chuck, 1/2 in Chuck, 0 to 3200 rpm Speed', '/shop/7675184', 8.273381294964029, 32.68817231646575, 29.136690647482016, 14.78494623655914, 2, NULL, '2025-11-28 11:58:47.956', '2025-11-28 06:58:47.956');
INSERT INTO public.flipbook_hotspots VALUES ('e4f10bd7-dad7-4840-b198-f779c6c2b465', '1fe196e5-c4eb-4690-b5e7-6732f13f490d', '7853229', 'DEWALT DCD771C2 Drill/Driver Kit, Battery Included, 20 V, 1/2 in Chuck, Keyless Chuck', '/shop/7853229', 9.712230215827338, 79.19354729327677, 33.21342925659472, 15.412186379928317, 3, NULL, '2025-11-28 12:04:24.308', '2025-11-28 07:04:24.308');
INSERT INTO public.flipbook_hotspots VALUES ('891cc9dc-4310-4351-821d-dc0cb783d85a', '1fe196e5-c4eb-4690-b5e7-6732f13f490d', '7853229', 'DEWALT DCD771C2 Drill/Driver Kit, Battery Included, 20 V, 1/2 in Chuck, Keyless Chuck', '/shop/7853229', 8.633093525179856, 48.36917726797015, 32.014388489208635, 14.96415770609319, 4, NULL, '2025-11-28 13:17:27.889', '2025-11-28 08:17:27.889');
INSERT INTO public.flipbook_hotspots VALUES ('b162ded0-d6a3-4ced-a629-781448bcce3a', '1fe196e5-c4eb-4690-b5e7-6732f13f490d', '7691595', 'DEWALT DCD740C1 Drill/Driver Kit, Battery Included, 20 V, 3/8 in Chuck, Keyless, Ratcheting Chuck', '/shop/7691595', 8.15347721822542, 14.283153574953797, 28.65707434052758, 16.666666666666664, 0, NULL, '2025-11-28 11:49:07.391', '2025-11-28 06:49:07.391');
INSERT INTO public.flipbook_hotspots VALUES ('186faa41-9aa4-412b-a68c-a4f0266b7fe3', '1fe196e5-c4eb-4690-b5e7-6732f13f490d', '7863236', 'Skil 9206-02 Reciprocating Saw, 7.5 A, 180 mm Cutting Capacity, 1-1/8 in L Stroke, 800 to 2700 spm', '/shop/7863236', 9.59232613908873, 64.76702536306074, 32.25419664268585, 12.455197132616487, 1, NULL, '2025-11-28 11:51:22.59', '2025-11-28 06:51:22.59');
INSERT INTO public.flipbook_hotspots VALUES ('17776a7f-f648-4331-a151-92bc1f58dec3', '1fe196e5-c4eb-4690-b5e7-6732f13f490d', '7675184', 'Bosch HD18-2 Hammer Drill, 8.5 A, Keyed Chuck, 1/2 in Chuck, 0 to 3200 rpm Speed', '/shop/7675184', 8.273381294964029, 32.68817231646575, 29.136690647482016, 14.78494623655914, 2, NULL, '2025-11-28 11:58:47.956', '2025-11-28 06:58:47.956');
INSERT INTO public.flipbook_hotspots VALUES ('6a2f7462-c4bd-442e-b8dc-60f0ce44f9e1', '1fe196e5-c4eb-4690-b5e7-6732f13f490d', '7853229', 'DEWALT DCD771C2 Drill/Driver Kit, Battery Included, 20 V, 1/2 in Chuck, Keyless Chuck', '/shop/7853229', 9.712230215827338, 79.19354729327677, 33.21342925659472, 15.412186379928317, 3, NULL, '2025-11-28 12:04:24.308', '2025-11-28 07:04:24.308');
INSERT INTO public.flipbook_hotspots VALUES ('2d3ab238-6cf1-4b91-84a5-11e90eaee7a1', '1fe196e5-c4eb-4690-b5e7-6732f13f490d', '7853229', 'DEWALT DCD771C2 Drill/Driver Kit, Battery Included, 20 V, 1/2 in Chuck, Keyless Chuck', '/shop/7853229', 8.633093525179856, 48.36917726797015, 32.014388489208635, 14.96415770609319, 4, NULL, '2025-11-28 13:17:27.889', '2025-11-28 08:17:27.889');


--
-- Data for Name: flipbook_pages; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.flipbook_pages VALUES ('0bb83f64-df4e-4e96-9e4d-96a332e2dca6', '2025-Spring-Summer-Catalogue', 1, '/uploads/flipbooks/2025-Spring-Summer-Catalogue/page-1.png', '2025-11-27 18:44:27.638181', '2025-11-27 13:44:27.638', NULL);
INSERT INTO public.flipbook_pages VALUES ('8b84a5e6-82bc-4dc1-9976-b02a7b738244', '2025-Spring-Summer-Catalogue', 2, '/uploads/flipbooks/2025-Spring-Summer-Catalogue/page-2.png', '2025-11-27 18:44:47.475332', '2025-11-27 13:44:47.475', NULL);
INSERT INTO public.flipbook_pages VALUES ('092e9a8f-56da-456c-8595-9e554f67bd12', '2025-Spring-Summer-Catalogue', 3, '/uploads/flipbooks/2025-Spring-Summer-Catalogue/page-3.png', '2025-11-27 18:45:15.992797', '2025-11-27 13:45:15.992', NULL);
INSERT INTO public.flipbook_pages VALUES ('f91b17cb-e46b-4575-aad8-7f1b2e82a8e1', '2025-Spring-Summer-Catalogue', 4, '/uploads/flipbooks/2025-Spring-Summer-Catalogue/page-4.png', '2025-11-27 18:45:33.099784', '2025-11-27 13:45:33.099', NULL);
INSERT INTO public.flipbook_pages VALUES ('c91354e1-63e7-4d84-9376-701dd522ebc5', '2025-Spring-Summer-Catalogue', 5, '/uploads/flipbooks/2025-Spring-Summer-Catalogue/page-5.png', '2025-11-27 18:45:49.086219', '2025-11-27 13:45:49.086', NULL);
INSERT INTO public.flipbook_pages VALUES ('ef262179-2c50-4daf-b3b3-31e2a53c884a', '2025-Spring-Summer-Catalogue', 6, '/uploads/flipbooks/2025-Spring-Summer-Catalogue/page-6.png', '2025-11-27 18:46:43.676741', '2025-11-27 13:46:43.676', NULL);
INSERT INTO public.flipbook_pages VALUES ('fbe1311c-9de9-4f7f-bdd6-134c18308c63', '2025-Spring-Summer-Catalogue', 7, '/uploads/flipbooks/2025-Spring-Summer-Catalogue/page-7.png', '2025-11-27 18:47:07.205502', '2025-11-27 13:47:07.205', NULL);
INSERT INTO public.flipbook_pages VALUES ('87268939-7321-402f-a841-f7213af34739', '2025-26-Fall---Winter-Catalogue', 1, '/uploads/flipbooks/2025-26-Fall---Winter-Catalogue/page-1.webp', '2025-11-28 02:22:32.285294', '2025-11-27 21:22:32.285', NULL);
INSERT INTO public.flipbook_pages VALUES ('1fe196e5-c4eb-4690-b5e7-6732f13f490d', '2025-26-Fall---Winter-Catalogue', 2, '/uploads/flipbooks/2025-26-Fall---Winter-Catalogue/page-2.webp', '2025-11-28 02:22:48.722252', '2025-11-27 21:22:48.722', NULL);
INSERT INTO public.flipbook_pages VALUES ('fb9a921b-7f9d-4373-8d3c-0619a6819f8f', '2025-26-Fall---Winter-Catalogue', 3, '/uploads/flipbooks/2025-26-Fall---Winter-Catalogue/page-3.webp', '2025-11-28 02:23:13.155552', '2025-11-27 21:23:13.155', NULL);
INSERT INTO public.flipbook_pages VALUES ('9e456116-6b6d-4b1d-96ea-1ee6ddfb661b', '2025-26-Fall---Winter-Catalogue', 4, '/uploads/flipbooks/2025-26-Fall---Winter-Catalogue/page-4.webp', '2025-11-28 02:23:38.810929', '2025-11-27 21:23:38.81', NULL);
INSERT INTO public.flipbook_pages VALUES ('02814f35-4222-4187-bea5-becf8fe2b799', '2025-26-Fall---Winter-Catalogue', 5, '/uploads/flipbooks/2025-26-Fall---Winter-Catalogue/page-5.webp', '2025-11-28 02:30:20.803753', '2025-11-27 21:30:20.803', NULL);
INSERT INTO public.flipbook_pages VALUES ('f5a12806-a99c-4764-a134-91c6adab1cd5', '2025-26-Fall---Winter-Catalogue', 6, '/uploads/flipbooks/2025-26-Fall---Winter-Catalogue/page-6.webp', '2025-11-28 02:30:39.391883', '2025-11-27 21:30:39.391', NULL);
INSERT INTO public.flipbook_pages VALUES ('0ac4103b-955f-4b53-8be3-e18aa2c068c6', '2025-26-Fall---Winter-Catalogue', 7, '/uploads/flipbooks/2025-26-Fall---Winter-Catalogue/page-7.webp', '2025-11-28 02:30:55.882436', '2025-11-27 21:30:55.882', NULL);


--
-- Data for Name: flipbooks; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.flipbooks VALUES ('2026-Spring---Summer', '2026 Spring & Summer', '2025-11-24 18:47:52.950341', '2025-11-24 13:47:52.95', '', false);
INSERT INTO public.flipbooks VALUES ('2025-Spring-Summer-Catalogue', '2025/26 Fall & Winter Catalogue', '2025-11-21 12:37:52.42694', '2025-11-27 21:22:19.96', '', false);
INSERT INTO public.flipbooks VALUES ('2025-26-Fall---Winter-Catalogue', '2025/26 Fall & Winter Catalogue', '2025-11-28 02:22:12.542043', '2025-11-27 21:22:19.974', '', true);


--
-- Name: flipbook_pages UQ_flipbook_page; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.flipbook_pages
    ADD CONSTRAINT "UQ_flipbook_page" UNIQUE ("flipbookId", "pageNumber");


--
-- Name: flipbook_hotspots flipbook_hotspots_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.flipbook_hotspots
    ADD CONSTRAINT flipbook_hotspots_pkey PRIMARY KEY (id);


--
-- Name: flipbook_pages flipbook_pages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.flipbook_pages
    ADD CONSTRAINT flipbook_pages_pkey PRIMARY KEY (id);


--
-- Name: flipbooks flipbooks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.flipbooks
    ADD CONSTRAINT flipbooks_pkey PRIMARY KEY (id);


--
-- Name: IDX_flipbook_hotspots_pageId; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_flipbook_hotspots_pageId" ON public.flipbook_hotspots USING btree ("pageId");


--
-- Name: IDX_flipbook_pages_flipbookId_pageNumber; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_flipbook_pages_flipbookId_pageNumber" ON public.flipbook_pages USING btree ("flipbookId", "pageNumber");


--
-- Name: flipbook_hotspots FK_flipbook_hotspots_pageId; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.flipbook_hotspots
    ADD CONSTRAINT "FK_flipbook_hotspots_pageId" FOREIGN KEY ("pageId") REFERENCES public.flipbook_pages(id) ON DELETE CASCADE;


--
-- Name: flipbook_pages FK_flipbook_pages_flipbookId; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.flipbook_pages
    ADD CONSTRAINT "FK_flipbook_pages_flipbookId" FOREIGN KEY ("flipbookId") REFERENCES public.flipbooks(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict X8Wa4vZSWbe1WvSkB10lZdYtNlDvukdWJy1cp2tGRpcBXbiVzXqab6cA1HkRiXh

