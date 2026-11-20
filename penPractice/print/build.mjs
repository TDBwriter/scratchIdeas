// Builds Clear & Quick Print with the shared handwriting-book builder (../hand/build.mjs).
//   node build.mjs [--page eink|letter|a4] [--out DIR] [--refs]
process.argv.splice(2, 0, 'print');
await import('../hand/build.mjs');
