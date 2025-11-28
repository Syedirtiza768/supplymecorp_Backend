UPDATE flipbooks SET "isFeatured" = false;
UPDATE flipbooks SET "isFeatured" = true WHERE id = (SELECT id FROM flipbooks ORDER BY "createdAt" DESC LIMIT 1);
SELECT id, title, "isFeatured", "createdAt" FROM flipbooks ORDER BY "createdAt" DESC;
