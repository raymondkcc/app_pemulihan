export const MAP_THEMES = [
  {
    id: "hutan-mistik",
    title: "Hutan Mistik",
    image: "/images/maps/hutan-mistik.jpg",
    thumbnail: "/images/maps/hutan-mistik-thumb.jpg",
    positions: [[32, 49], [72, 49], [46, 81], [83, 36]]
  },
  {
    id: "pulau-lanun-ceria",
    title: "Pulau Lanun Ceria",
    image: "/images/maps/pulau-lanun-ceria.jpg",
    thumbnail: "/images/maps/pulau-lanun-ceria-thumb.jpg",
    positions: [[24, 71], [51, 51], [48, 25], [80, 23]]
  },
  {
    id: "angkasa-bintang",
    title: "Angkasa Bintang",
    image: "/images/maps/angkasa-bintang.jpg",
    thumbnail: "/images/maps/angkasa-bintang-thumb.jpg",
    positions: [[13, 91], [51, 88], [51, 51], [61, 16]]
  },
  {
    id: "kota-robot",
    title: "Kota Robot",
    image: "/images/maps/kota-robot.jpg",
    thumbnail: "/images/maps/kota-robot-thumb.jpg",
    positions: [[50, 90], [50, 53], [50, 20], [87, 23]]
  },
  {
    id: "lembah-dinosaur",
    title: "Lembah Dinosaur",
    image: "/images/maps/lembah-dinosaur.jpg",
    thumbnail: "/images/maps/lembah-dinosaur-thumb.jpg",
    positions: [[14, 78], [51, 52], [61, 28], [86, 28]]
  }
];

export const DEFAULT_MAP_THEME = MAP_THEMES[0].id;

export function getMapTheme(themeId) {
  return MAP_THEMES.find((theme) => theme.id === themeId) || MAP_THEMES[0];
}
