export type SkillCategory =
  | 'language'
  | 'framework'
  | 'library'
  | 'database'
  | 'cloud'
  | 'devops'
  | 'tool'
  | 'concept'
  | 'soft_skill';

export interface TaxonomyEntry {
  canonical: string;
  category: SkillCategory;
  synonyms: string[];
  relatedGroup?: string;
}

export const SKILL_TAXONOMY: TaxonomyEntry[] = [
  // ── Languages ──
  { canonical: 'JavaScript', category: 'language', synonyms: ['javascript', 'js', 'ecmascript', 'es6', 'es2015', 'es2020', 'es2021', 'es2022', 'vanilla js'], relatedGroup: 'js-ecosystem' },
  { canonical: 'TypeScript', category: 'language', synonyms: ['typescript', 'ts', 'type script'], relatedGroup: 'js-ecosystem' },
  { canonical: 'Python', category: 'language', synonyms: ['python', 'python3', 'py', 'cpython'], relatedGroup: 'python-ecosystem' },
  { canonical: 'Java', category: 'language', synonyms: ['java', 'jdk', 'jre', 'j2ee', 'java ee', 'jakarta ee'], relatedGroup: 'jvm-ecosystem' },
  { canonical: 'Go', category: 'language', synonyms: ['golang', 'go lang'], relatedGroup: 'systems-languages' },
  { canonical: 'Rust', category: 'language', synonyms: ['rust', 'rustlang'], relatedGroup: 'systems-languages' },
  { canonical: 'C#', category: 'language', synonyms: ['c#', 'csharp', 'c sharp'], relatedGroup: 'dotnet-ecosystem' },
  { canonical: 'C++', category: 'language', synonyms: ['c++', 'cpp', 'cplusplus'], relatedGroup: 'systems-languages' },
  { canonical: 'C', category: 'language', synonyms: ['c lang', 'ansi c'], relatedGroup: 'systems-languages' },
  { canonical: 'Ruby', category: 'language', synonyms: ['ruby', 'rb'], relatedGroup: 'ruby-ecosystem' },
  { canonical: 'PHP', category: 'language', synonyms: ['php', 'php7', 'php8'], relatedGroup: 'php-ecosystem' },
  { canonical: 'Swift', category: 'language', synonyms: ['swift'], relatedGroup: 'apple-ecosystem' },
  { canonical: 'Kotlin', category: 'language', synonyms: ['kotlin', 'kt'], relatedGroup: 'jvm-ecosystem' },
  { canonical: 'Scala', category: 'language', synonyms: ['scala'], relatedGroup: 'jvm-ecosystem' },
  { canonical: 'R', category: 'language', synonyms: ['r lang', 'r programming', 'rlang'], relatedGroup: 'data-science' },
  { canonical: 'Dart', category: 'language', synonyms: ['dart'], relatedGroup: 'mobile-dev' },
  { canonical: 'Elixir', category: 'language', synonyms: ['elixir'], relatedGroup: 'functional-languages' },
  { canonical: 'Haskell', category: 'language', synonyms: ['haskell'], relatedGroup: 'functional-languages' },
  { canonical: 'Lua', category: 'language', synonyms: ['lua'], relatedGroup: 'scripting-languages' },
  { canonical: 'Perl', category: 'language', synonyms: ['perl'], relatedGroup: 'scripting-languages' },
  { canonical: 'SQL', category: 'language', synonyms: ['sql', 'structured query language', 'plpgsql', 'pl/sql', 't-sql', 'tsql'], relatedGroup: 'data-query' },
  { canonical: 'Shell', category: 'language', synonyms: ['shell', 'bash', 'zsh', 'shell scripting', 'sh'], relatedGroup: 'scripting-languages' },

  // ── Frontend Frameworks ──
  { canonical: 'React', category: 'framework', synonyms: ['react', 'reactjs', 'react.js', 'react js'], relatedGroup: 'frontend-frameworks' },
  { canonical: 'Next.js', category: 'framework', synonyms: ['nextjs', 'next.js', 'next js'], relatedGroup: 'frontend-frameworks' },
  { canonical: 'Vue', category: 'framework', synonyms: ['vue', 'vuejs', 'vue.js', 'vue3', 'vue 3', 'vue 2'], relatedGroup: 'frontend-frameworks' },
  { canonical: 'Nuxt', category: 'framework', synonyms: ['nuxt', 'nuxtjs', 'nuxt.js'], relatedGroup: 'frontend-frameworks' },
  { canonical: 'Angular', category: 'framework', synonyms: ['angular', 'angularjs', 'angular.js', 'angular 2+'], relatedGroup: 'frontend-frameworks' },
  { canonical: 'Svelte', category: 'framework', synonyms: ['svelte', 'sveltejs', 'sveltekit'], relatedGroup: 'frontend-frameworks' },
  { canonical: 'Solid.js', category: 'framework', synonyms: ['solidjs', 'solid.js', 'solid js'], relatedGroup: 'frontend-frameworks' },
  { canonical: 'Astro', category: 'framework', synonyms: ['astro', 'astro.build'], relatedGroup: 'frontend-frameworks' },
  { canonical: 'Remix', category: 'framework', synonyms: ['remix', 'remix.run'], relatedGroup: 'frontend-frameworks' },

  // ── Backend Frameworks ──
  { canonical: 'Node.js', category: 'framework', synonyms: ['node', 'nodejs', 'node.js', 'node js'], relatedGroup: 'node-web-frameworks' },
  { canonical: 'Express', category: 'framework', synonyms: ['express', 'expressjs', 'express.js'], relatedGroup: 'node-web-frameworks' },
  { canonical: 'NestJS', category: 'framework', synonyms: ['nestjs', 'nest.js', 'nest'], relatedGroup: 'node-web-frameworks' },
  { canonical: 'Fastify', category: 'framework', synonyms: ['fastify'], relatedGroup: 'node-web-frameworks' },
  { canonical: 'Hono', category: 'framework', synonyms: ['hono', 'honojs'], relatedGroup: 'node-web-frameworks' },
  { canonical: 'Django', category: 'framework', synonyms: ['django', 'django rest framework', 'drf'], relatedGroup: 'python-web-frameworks' },
  { canonical: 'Flask', category: 'framework', synonyms: ['flask'], relatedGroup: 'python-web-frameworks' },
  { canonical: 'FastAPI', category: 'framework', synonyms: ['fastapi', 'fast api'], relatedGroup: 'python-web-frameworks' },
  { canonical: 'Spring Boot', category: 'framework', synonyms: ['spring boot', 'spring', 'spring framework', 'spring mvc'], relatedGroup: 'jvm-web-frameworks' },
  { canonical: 'Ruby on Rails', category: 'framework', synonyms: ['rails', 'ruby on rails', 'ror'], relatedGroup: 'ruby-ecosystem' },
  { canonical: 'Laravel', category: 'framework', synonyms: ['laravel'], relatedGroup: 'php-ecosystem' },
  { canonical: 'ASP.NET', category: 'framework', synonyms: ['asp.net', 'aspnet', 'asp.net core', '.net core', 'dotnet'], relatedGroup: 'dotnet-ecosystem' },
  { canonical: 'Gin', category: 'framework', synonyms: ['gin', 'gin-gonic'], relatedGroup: 'go-web-frameworks' },
  { canonical: 'Fiber', category: 'framework', synonyms: ['fiber', 'gofiber'], relatedGroup: 'go-web-frameworks' },
  { canonical: 'Phoenix', category: 'framework', synonyms: ['phoenix', 'phoenix framework'], relatedGroup: 'functional-languages' },

  // ── Mobile ──
  { canonical: 'React Native', category: 'framework', synonyms: ['react native', 'react-native', 'rn'], relatedGroup: 'mobile-dev' },
  { canonical: 'Flutter', category: 'framework', synonyms: ['flutter'], relatedGroup: 'mobile-dev' },
  { canonical: 'SwiftUI', category: 'framework', synonyms: ['swiftui', 'swift ui'], relatedGroup: 'apple-ecosystem' },
  { canonical: 'Expo', category: 'framework', synonyms: ['expo'], relatedGroup: 'mobile-dev' },

  // ── Libraries ──
  { canonical: 'Redux', category: 'library', synonyms: ['redux', 'redux toolkit', 'rtk'], relatedGroup: 'state-management' },
  { canonical: 'Zustand', category: 'library', synonyms: ['zustand'], relatedGroup: 'state-management' },
  { canonical: 'TailwindCSS', category: 'library', synonyms: ['tailwind', 'tailwindcss', 'tailwind css'], relatedGroup: 'css-tools' },
  { canonical: 'Sass', category: 'library', synonyms: ['sass', 'scss'], relatedGroup: 'css-tools' },
  { canonical: 'Styled Components', category: 'library', synonyms: ['styled components', 'styled-components'], relatedGroup: 'css-tools' },
  { canonical: 'Prisma', category: 'library', synonyms: ['prisma', 'prisma orm'], relatedGroup: 'orm' },
  { canonical: 'Drizzle', category: 'library', synonyms: ['drizzle', 'drizzle orm'], relatedGroup: 'orm' },
  { canonical: 'Sequelize', category: 'library', synonyms: ['sequelize'], relatedGroup: 'orm' },
  { canonical: 'TypeORM', category: 'library', synonyms: ['typeorm', 'type orm'], relatedGroup: 'orm' },
  { canonical: 'Mongoose', category: 'library', synonyms: ['mongoose'], relatedGroup: 'orm' },
  { canonical: 'Socket.io', category: 'library', synonyms: ['socket.io', 'socketio', 'websockets', 'websocket', 'ws'], relatedGroup: 'realtime' },
  { canonical: 'tRPC', category: 'library', synonyms: ['trpc', 't-rpc'], relatedGroup: 'api-styles' },
  { canonical: 'Zod', category: 'library', synonyms: ['zod'], relatedGroup: 'validation' },
  { canonical: 'Pandas', category: 'library', synonyms: ['pandas'], relatedGroup: 'data-science' },
  { canonical: 'NumPy', category: 'library', synonyms: ['numpy'], relatedGroup: 'data-science' },
  { canonical: 'TensorFlow', category: 'library', synonyms: ['tensorflow', 'tf'], relatedGroup: 'ml-frameworks' },
  { canonical: 'PyTorch', category: 'library', synonyms: ['pytorch', 'torch'], relatedGroup: 'ml-frameworks' },
  { canonical: 'Scikit-learn', category: 'library', synonyms: ['scikit-learn', 'sklearn', 'scikit learn'], relatedGroup: 'ml-frameworks' },

  // ── Databases ──
  { canonical: 'PostgreSQL', category: 'database', synonyms: ['postgresql', 'postgres', 'pg', 'psql'], relatedGroup: 'relational-databases' },
  { canonical: 'MySQL', category: 'database', synonyms: ['mysql', 'mariadb'], relatedGroup: 'relational-databases' },
  { canonical: 'SQLite', category: 'database', synonyms: ['sqlite', 'sqlite3'], relatedGroup: 'relational-databases' },
  { canonical: 'MongoDB', category: 'database', synonyms: ['mongodb', 'mongo'], relatedGroup: 'nosql-databases' },
  { canonical: 'Redis', category: 'database', synonyms: ['redis', 'redis cache'], relatedGroup: 'cache-stores' },
  { canonical: 'DynamoDB', category: 'database', synonyms: ['dynamodb', 'dynamo db', 'dynamo'], relatedGroup: 'nosql-databases' },
  { canonical: 'Elasticsearch', category: 'database', synonyms: ['elasticsearch', 'elastic search', 'elastic', 'opensearch'], relatedGroup: 'search-engines' },
  { canonical: 'Cassandra', category: 'database', synonyms: ['cassandra', 'apache cassandra'], relatedGroup: 'nosql-databases' },
  { canonical: 'Neo4j', category: 'database', synonyms: ['neo4j', 'graph database'], relatedGroup: 'nosql-databases' },
  { canonical: 'Supabase', category: 'database', synonyms: ['supabase'], relatedGroup: 'relational-databases' },
  { canonical: 'Firebase', category: 'database', synonyms: ['firebase', 'firestore', 'firebase realtime'], relatedGroup: 'nosql-databases' },

  // ── Cloud ──
  { canonical: 'AWS', category: 'cloud', synonyms: ['aws', 'amazon web services', 'ec2', 's3', 'lambda', 'ecs', 'eks', 'cloudformation', 'sqs', 'sns', 'rds', 'dynamodb'], relatedGroup: 'cloud-providers' },
  { canonical: 'GCP', category: 'cloud', synonyms: ['gcp', 'google cloud', 'google cloud platform', 'cloud run', 'bigquery', 'gke'], relatedGroup: 'cloud-providers' },
  { canonical: 'Azure', category: 'cloud', synonyms: ['azure', 'microsoft azure', 'azure devops'], relatedGroup: 'cloud-providers' },
  { canonical: 'Vercel', category: 'cloud', synonyms: ['vercel'], relatedGroup: 'deployment-platforms' },
  { canonical: 'Netlify', category: 'cloud', synonyms: ['netlify'], relatedGroup: 'deployment-platforms' },
  { canonical: 'Heroku', category: 'cloud', synonyms: ['heroku'], relatedGroup: 'deployment-platforms' },
  { canonical: 'DigitalOcean', category: 'cloud', synonyms: ['digitalocean', 'digital ocean'], relatedGroup: 'cloud-providers' },
  { canonical: 'Cloudflare', category: 'cloud', synonyms: ['cloudflare', 'cloudflare workers'], relatedGroup: 'cloud-providers' },

  // ── DevOps ──
  { canonical: 'Docker', category: 'devops', synonyms: ['docker', 'dockerfile', 'docker compose', 'docker-compose', 'containerization'], relatedGroup: 'containers' },
  { canonical: 'Kubernetes', category: 'devops', synonyms: ['kubernetes', 'k8s', 'kubectl', 'helm', 'k3s'], relatedGroup: 'containers' },
  { canonical: 'Terraform', category: 'devops', synonyms: ['terraform', 'tf', 'hcl', 'infrastructure as code', 'iac'], relatedGroup: 'iac-tools' },
  { canonical: 'Ansible', category: 'devops', synonyms: ['ansible'], relatedGroup: 'iac-tools' },
  { canonical: 'CI/CD', category: 'devops', synonyms: ['ci/cd', 'cicd', 'continuous integration', 'continuous delivery', 'continuous deployment', 'github actions', 'gitlab ci', 'jenkins', 'circleci', 'travis ci', 'bitbucket pipelines'], relatedGroup: 'ci-cd' },
  { canonical: 'Nginx', category: 'devops', synonyms: ['nginx', 'reverse proxy'], relatedGroup: 'web-servers' },
  { canonical: 'Linux', category: 'devops', synonyms: ['linux', 'ubuntu', 'debian', 'centos', 'rhel', 'fedora'], relatedGroup: 'operating-systems' },
  { canonical: 'Prometheus', category: 'devops', synonyms: ['prometheus'], relatedGroup: 'monitoring' },
  { canonical: 'Grafana', category: 'devops', synonyms: ['grafana'], relatedGroup: 'monitoring' },
  { canonical: 'Datadog', category: 'devops', synonyms: ['datadog'], relatedGroup: 'monitoring' },

  // ── Tools ──
  { canonical: 'Git', category: 'tool', synonyms: ['git', 'github', 'gitlab', 'bitbucket', 'version control', 'source control'] },
  { canonical: 'GraphQL', category: 'tool', synonyms: ['graphql', 'graph ql', 'apollo', 'apollo graphql'], relatedGroup: 'api-styles' },
  { canonical: 'REST API', category: 'tool', synonyms: ['rest', 'rest api', 'restful', 'restful api'], relatedGroup: 'api-styles' },
  { canonical: 'gRPC', category: 'tool', synonyms: ['grpc', 'protocol buffers', 'protobuf'], relatedGroup: 'api-styles' },
  { canonical: 'Webpack', category: 'tool', synonyms: ['webpack'], relatedGroup: 'build-tools' },
  { canonical: 'Vite', category: 'tool', synonyms: ['vite', 'vitejs'], relatedGroup: 'build-tools' },
  { canonical: 'ESBuild', category: 'tool', synonyms: ['esbuild'], relatedGroup: 'build-tools' },
  { canonical: 'Turborepo', category: 'tool', synonyms: ['turborepo', 'turbo'], relatedGroup: 'build-tools' },
  { canonical: 'Storybook', category: 'tool', synonyms: ['storybook'], relatedGroup: 'testing-tools' },
  { canonical: 'Figma', category: 'tool', synonyms: ['figma'], relatedGroup: 'design-tools' },
  { canonical: 'Postman', category: 'tool', synonyms: ['postman', 'insomnia'], relatedGroup: 'api-tools' },
  { canonical: 'RabbitMQ', category: 'tool', synonyms: ['rabbitmq', 'rabbit mq', 'amqp'], relatedGroup: 'message-queues' },
  { canonical: 'Kafka', category: 'tool', synonyms: ['kafka', 'apache kafka'], relatedGroup: 'message-queues' },
  { canonical: 'OAuth', category: 'tool', synonyms: ['oauth', 'oauth2', 'oauth 2.0', 'openid', 'oidc'], relatedGroup: 'auth-tools' },
  { canonical: 'JWT', category: 'tool', synonyms: ['jwt', 'json web token', 'json web tokens'], relatedGroup: 'auth-tools' },

  // ── Concepts ──
  { canonical: 'Microservices', category: 'concept', synonyms: ['microservices', 'micro services', 'microservice architecture', 'service oriented'] },
  { canonical: 'System Design', category: 'concept', synonyms: ['system design', 'distributed systems', 'scalability', 'high availability'] },
  { canonical: 'Testing', category: 'concept', synonyms: ['testing', 'unit testing', 'integration testing', 'e2e testing', 'tdd', 'bdd', 'jest', 'mocha', 'pytest', 'cypress', 'playwright', 'selenium', 'vitest'] },
  { canonical: 'DevOps', category: 'concept', synonyms: ['devops', 'site reliability', 'sre', 'infrastructure'] },
  { canonical: 'Machine Learning', category: 'concept', synonyms: ['machine learning', 'ml', 'deep learning', 'ai', 'artificial intelligence', 'nlp', 'natural language processing', 'computer vision', 'llm', 'large language model'], relatedGroup: 'data-science' },
  { canonical: 'Data Engineering', category: 'concept', synonyms: ['data engineering', 'etl', 'data pipeline', 'data warehouse', 'data lake'], relatedGroup: 'data-science' },
  { canonical: 'Security', category: 'concept', synonyms: ['security', 'cybersecurity', 'penetration testing', 'owasp', 'encryption', 'authentication', 'authorization'] },
  { canonical: 'Accessibility', category: 'concept', synonyms: ['accessibility', 'a11y', 'wcag', 'aria'] },
  { canonical: 'Performance Optimization', category: 'concept', synonyms: ['performance', 'optimization', 'caching', 'load balancing', 'cdn'] },
  { canonical: 'API Design', category: 'concept', synonyms: ['api design', 'api architecture', 'api gateway'] },

  // ── Soft Skills ──
  { canonical: 'Agile', category: 'soft_skill', synonyms: ['agile', 'scrum', 'kanban', 'sprint', 'standup', 'retrospective', 'jira', 'agile methodology'] },
  { canonical: 'Leadership', category: 'soft_skill', synonyms: ['leadership', 'team lead', 'tech lead', 'mentoring', 'mentorship', 'coaching'] },
  { canonical: 'Communication', category: 'soft_skill', synonyms: ['communication', 'presentation', 'public speaking', 'technical writing', 'documentation'] },
  { canonical: 'Problem Solving', category: 'soft_skill', synonyms: ['problem solving', 'analytical thinking', 'critical thinking', 'debugging'] },
  { canonical: 'Collaboration', category: 'soft_skill', synonyms: ['collaboration', 'teamwork', 'cross-functional', 'stakeholder management'] },
  { canonical: 'Project Management', category: 'soft_skill', synonyms: ['project management', 'product management', 'roadmap', 'planning', 'estimation'] },
];

// ── Reverse lookup index: synonym -> TaxonomyEntry ──
const synonymIndex = new Map<string, TaxonomyEntry>();
for (const entry of SKILL_TAXONOMY) {
  for (const syn of entry.synonyms) {
    synonymIndex.set(syn.toLowerCase(), entry);
  }
}

export function canonicalize(rawSkill: string): TaxonomyEntry | null {
  return synonymIndex.get(rawSkill.toLowerCase().trim()) ?? null;
}

export function hasExactMatch(candidateSkills: string[], targetSkill: string): boolean {
  const targetEntry = canonicalize(targetSkill);
  if (!targetEntry) return false;
  return candidateSkills.some((s) => {
    const entry = canonicalize(s);
    return entry?.canonical === targetEntry.canonical;
  });
}

export function hasPartialMatch(candidateSkills: string[], targetSkill: string): boolean {
  const targetEntry = canonicalize(targetSkill);
  if (!targetEntry?.relatedGroup) return false;
  return candidateSkills.some((s) => {
    const entry = canonicalize(s);
    return (
      entry?.relatedGroup === targetEntry.relatedGroup &&
      entry?.canonical !== targetEntry.canonical
    );
  });
}

export function getAllCanonicalNames(): string[] {
  return SKILL_TAXONOMY.map((e) => e.canonical);
}
