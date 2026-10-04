# Prompt gambar permainan padanan huruf

Use one prompt per image. Generate one square transparent PNG arranged as a clean **2x2 grid**. Put exactly one animal in each cell so the image can be cropped into four individual transparent PNG assets with predictable quadrants.

## Required 2x2 layout

Use four equal-sized cells with a narrow clean transparent gap between them:

```text
┌─────────────────┬─────────────────┐
│ mother animal 1 │ cub animal 1    │
├─────────────────┼─────────────────┤
│ mother animal 2 │ cub animal 2    │
└─────────────────┴─────────────────┘
```

The top row is one mother-and-cub pair. The bottom row is a second mother-and-cub pair. This layout makes cropping simple: top-left, top-right, bottom-left and bottom-right. Put only one full animal in each cell, centered and completely inside its cell. Do not place a mother and cub in the same cell.

## Art direction to keep in every prompt

Create a cheerful 3D children's learning illustration, similar to a polished toy-like children's app asset. Use soft rounded shapes, friendly expressive faces, bright but gentle colours, clean materials, front three-quarter view, consistent camera angle and lighting, and consistent scale across all four animals. Use a plain transparent background. Keep every animal's full body visible with generous padding on all sides. Leave clear empty space near the raised paw, hand, trunk or front foot so a separate letter badge can be added later.

Keep the 2x2 cells clearly separated with a narrow transparent gap. Do not let any animal cross a cell boundary. Do not crop ears, paws, tails or feet. Do not add shadows that cross into another cell. Do not include words, letters, numbers, labels, watermark, border, decorative panels or extra animals. Generate exactly four animals: two mothers and two matching cubs.

## Prompt 1: Bear and lion families

`Create one square transparent PNG as a clean 2x2 grid with four equal-sized cells and a narrow transparent gap between cells. Generate exactly four animals, one full animal centered in each cell. Top-left cell: a friendly mother brown bear with warm honey-brown fur, standing upright and holding one empty raised paw toward the camera for a separate uppercase B badge. Top-right cell: her small baby bear cub with matching honey-brown fur, sitting with both paws open and a welcoming pose for a separate lowercase b badge. Bottom-left cell: a friendly mother lion with golden fur and a soft rounded mane, standing upright and holding one empty raised paw toward the camera for a separate uppercase S badge. Bottom-right cell: her small lion cub with golden fur, sitting with both paws open and a welcoming pose for a separate lowercase s badge. Use a cheerful 3D children's learning illustration style, soft rounded shapes, friendly expressive faces, bright gentle colours, clean toy-like materials, front three-quarter view, consistent camera angle, consistent lighting and consistent scale. Keep every animal fully visible and completely inside its own cell with generous transparent padding. No mother-and-cub pair in the same cell. No words, letters, numbers, labels, watermark, border, decorative grid lines, background scene, extra animals, cropping, overlap or shadows crossing cell boundaries.`

## Prompt 2: Elephant and cat families

`Create one square transparent PNG as a clean 2x2 grid with four equal-sized cells and a narrow transparent gap between cells. Generate exactly four animals, one full animal centered in each cell. Top-left cell: a friendly mother elephant with soft blue-grey skin and kind oversized eyes, holding one empty raised trunk or front foot toward the camera for a separate uppercase G badge. Top-right cell: her small elephant calf with matching blue-grey skin, lifting its trunk in a welcoming pose for a separate lowercase g badge. Bottom-left cell: a friendly mother orange-and-cream striped cat sitting upright and holding one empty raised paw toward the camera for a separate uppercase K badge. Bottom-right cell: her small striped kitten sitting with both paws open and a welcoming pose for a separate lowercase k badge. Use a cheerful 3D children's learning illustration style, soft rounded shapes, friendly expressive faces, bright gentle colours, clean toy-like materials, front three-quarter view, consistent camera angle, consistent lighting and consistent scale. Keep every animal fully visible and completely inside its own cell with generous transparent padding. No mother-and-cub pair in the same cell. No words, letters, numbers, labels, watermark, border, decorative grid lines, background scene, extra animals, cropping, overlap or shadows crossing cell boundaries.`

## Prompt 3: Rabbit and tiger families

`Create one square transparent PNG as a clean 2x2 grid with four equal-sized cells and a narrow transparent gap between cells. Generate exactly four animals, one full animal centered in each cell. Top-left cell: a friendly mother rabbit with soft white and light brown fur and long ears, holding one empty raised paw toward the camera for a separate uppercase A badge. Top-right cell: her small bunny with matching soft fur, sitting with both paws open and a welcoming pose for a separate lowercase a badge. Bottom-left cell: a friendly mother tiger with orange fur and simple dark stripes, holding one empty raised paw toward the camera for a separate uppercase H badge. Bottom-right cell: her small tiger cub with matching orange fur and dark stripes, sitting with both paws open and a welcoming pose for a separate lowercase h badge. Use a cheerful 3D children's learning illustration style, soft rounded shapes, friendly expressive faces, bright gentle colours, clean toy-like materials, front three-quarter view, consistent camera angle, consistent lighting and consistent scale. Keep every animal fully visible and completely inside its own cell with generous transparent padding. No mother-and-cub pair in the same cell. No words, letters, numbers, labels, watermark, border, decorative grid lines, background scene, extra animals, cropping, overlap or shadows crossing cell boundaries.`

## Cropping note

After generation, crop each image using the four equal quadrants. Keep the transparent gap as a small margin, then trim each crop to the individual animal's transparent bounds. Rename the resulting files clearly, for example `bear-mother.png`, `bear-cub.png`, `lion-mother.png` and `lion-cub.png`. Add the uppercase and lowercase letter badges in the application so the letters remain sharp and readable at every screen size.
