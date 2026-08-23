import fs from 'fs';
import path from 'path';

const slidesDir = path.join(process.env.TEMP, 'pptx-extract', 'ppt', 'slides');
const mediaDir = path.join(process.env.TEMP, 'pptx-extract', 'ppt', 'media');

const slideFiles = fs.readdirSync(slidesDir)
  .filter((file) => file.endsWith('.xml'))
  .sort((a, b) => parseInt(a.replace(/\D/g, ''), 10) - parseInt(b.replace(/\D/g, ''), 10));

const results = [];

for (const slide of slideFiles) {
  const xml = fs.readFileSync(path.join(slidesDir, slide), 'utf8');
  const texts = [...xml.matchAll(/<a:t>([^<]*)<\/a:t>/g)]
    .map((match) => match[1].trim())
    .filter((text) => text.length > 0);

  const relsFile = path.join(slidesDir, '_rels', `${slide}.rels`);
  const media = [];
  if (fs.existsSync(relsFile)) {
    const rels = fs.readFileSync(relsFile, 'utf8');
    const matches = [...rels.matchAll(/Target="\.\.\/media\/([^"]+)"/g)];
    for (const match of matches) media.push(match[1]);
  }

  results.push({ slide, texts, media });
}

const interesting = results.filter((r) => r.texts.length > 0);
console.log(`Total slides: ${results.length}, slides with text: ${interesting.length}\n`);

for (const r of results.slice(0, 25)) {
  console.log(r.slide, '| texts:', JSON.stringify(r.texts), '| media:', JSON.stringify(r.media));
}
