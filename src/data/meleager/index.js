const modules = import.meta.glob('./*.json', { eager: true });
const texts = {};
for (const path of Object.keys(modules)) {
  const entry = modules[path].default;
  if (entry && entry.id) texts[entry.id] = entry;
}
export default texts;
