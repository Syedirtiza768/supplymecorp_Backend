-- Flipbook Database Export
-- Generated: 2025-12-26 21:38:53
-- Database: orgill
-- FlipbookId: 2025-26-Fall-Winter-Catalogue

SET client_encoding = 'UTF8';

-- Drop existing tables if they exist
DROP TABLE IF EXISTS flipbook_hotspots CASCADE;
DROP TABLE IF EXISTS flipbook_pages CASCADE;
DROP TABLE IF EXISTS flipbooks CASCADE;

-- Create flipbooks table
CREATE TABLE flipbooks (
    id character varying NOT NULL,
    title character varying NOT NULL,
    description text,
    "isFeatured" boolean DEFAULT false,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT "PK_flipbooks" PRIMARY KEY (id)
);

-- Create flipbook_pages table
CREATE TABLE flipbook_pages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "flipbookId" character varying NOT NULL,
    "pageNumber" integer NOT NULL,
    "imageUrl" character varying NOT NULL,
    meta jsonb,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT "PK_flipbook_pages" PRIMARY KEY (id),
    CONSTRAINT "UQ_flipbook_page" UNIQUE ("flipbookId", "pageNumber"),
    CONSTRAINT "FK_flipbook_pages_flipbook" FOREIGN KEY ("flipbookId") REFERENCES flipbooks(id) ON DELETE CASCADE
);

-- Create flipbook_hotspots table
CREATE TABLE flipbook_hotspots (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "pageId" uuid NOT NULL,
    "productSku" character varying,
    x double precision NOT NULL,
    y double precision NOT NULL,
    width double precision NOT NULL,
    height double precision NOT NULL,
    label character varying,
    "linkUrl" character varying,
    "zIndex" integer DEFAULT 0,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT "PK_flipbook_hotspots" PRIMARY KEY (id),
    CONSTRAINT "FK_flipbook_hotspots_page" FOREIGN KEY ("pageId") REFERENCES flipbook_pages(id) ON DELETE CASCADE
);

