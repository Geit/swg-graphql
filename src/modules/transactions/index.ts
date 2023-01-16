export function startModule() {
  const resolvers = [`${__dirname}/resolvers/*.{js,ts}`];

  return { queues: [], resolvers };
}
