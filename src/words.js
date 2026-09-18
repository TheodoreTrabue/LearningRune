export const words = [
  'CAT', 'DOG', 'SUN', 'MAP', 'INK', 'AIR', 'BIRD', 'FISH', 'STAR', 'MOON',
  'RAIN', 'WIND', 'FIRE', 'EARTH', 'WATER', 'STONE', 'LEAF', 'FERN', 'MOSS',
  'PATH', 'LAMP', 'DESK', 'CUP', 'HAT', 'BAG', 'BOX', 'KEY', 'FOX', 'OWL',
  'WOLF', 'DEER', 'NEST', 'SEED', 'HAND', 'HEART', 'LIGHT', 'NIGHT',
  'RUNE', 'GLYPH', 'SIGIL', 'ONYX', 'AZURE', 'MYRRH', 'AETHER'
].filter(word => word.length >= 2 && word.length <= 5 && !/EE|OO/.test(word));
