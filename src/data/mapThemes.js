export const MAP_THEMES = [
  {
    id: "hutan-mistik",
    title: "Hutan Mistik",
    image: "/images/maps/hutan-mistik.jpg",
    thumbnail: "/images/maps/hutan-mistik-thumb.jpg",
    positions: [[29, 42], [72, 43], [47, 86], [86, 20]]
  },
  {
    id: "pulau-lanun-ceria",
    title: "Pulau Lanun Ceria",
    image: "/images/maps/pulau-lanun-ceria.jpg",
    thumbnail: "/images/maps/pulau-lanun-ceria-thumb.jpg",
    positions: [[20, 77], [54, 50], [52, 21], [87, 19]]
  },
  {
    id: "angkasa-bintang",
    title: "Angkasa Bintang",
    image: "/images/maps/angkasa-bintang.jpg",
    thumbnail: "/images/maps/angkasa-bintang-thumb.jpg",
    positions: [[17, 88], [53, 91], [51, 48], [61, 14]]
  },
  {
    id: "kota-robot",
    title: "Kota Robot",
    image: "/images/maps/kota-robot.jpg",
    thumbnail: "/images/maps/kota-robot-thumb.jpg",
    positions: [[53, 89], [52, 50], [52, 20], [87, 21]]
  },
  {
    id: "lembah-dinosaur",
    title: "Lembah Dinosaur",
    image: "/images/maps/lembah-dinosaur.jpg",
    thumbnail: "/images/maps/lembah-dinosaur-thumb.jpg",
    positions: [[22, 76], [51, 49], [62, 20], [86, 28]]
  }
];

export const DEFAULT_MAP_THEME = MAP_THEMES[0].id;

export function getMapTheme(themeId) {
  return MAP_THEMES.find((theme) => theme.id === themeId) || MAP_THEMES[0];
}
