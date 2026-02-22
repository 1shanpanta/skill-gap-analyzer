export const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Skill Gap Analyzer API',
    version: '1.0.0',
    description:
      'Backend API for analyzing skill gaps between resumes and job descriptions. Produces deterministic alignment scores, skill gap breakdowns, and LLM-generated improvement roadmaps.',
  },
  servers: [{ url: 'http://localhost:3000', description: 'Local development' }],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string' },
          message: { type: 'string' },
          statusCode: { type: 'integer' },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' },
          name: { type: 'string' },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      AuthResponse: {
        type: 'object',
        properties: {
          user: { $ref: '#/components/schemas/User' },
          token: { type: 'string', description: 'JWT token' },
        },
      },
      ScoreBreakdown: {
        type: 'object',
        properties: {
          skill_match: { type: 'number' },
          seniority_alignment: { type: 'number' },
          github_signal: { type: 'number' },
          bonus_factors: { type: 'number' },
          weighted_total: { type: 'number' },
          weights_used: {
            type: 'object',
            properties: {
              skill: { type: 'number' },
              seniority: { type: 'number' },
              github: { type: 'number' },
              bonus: { type: 'number' },
            },
          },
        },
      },
      SkillGaps: {
        type: 'object',
        properties: {
          matchedSkills: { type: 'array', items: { type: 'string' } },
          missingRequired: { type: 'array', items: { type: 'string' } },
          missingPreferred: { type: 'array', items: { type: 'string' } },
          partialMatches: { type: 'array', items: { type: 'string' } },
          extraSkills: { type: 'array', items: { type: 'string' } },
        },
      },
      AnalysisFull: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          user_id: { type: 'string', format: 'uuid' },
          resume_id: { type: 'string', format: 'uuid' },
          job_description_id: { type: 'string', format: 'uuid' },
          status: { type: 'string', enum: ['pending', 'processing', 'completed', 'failed'] },
          overall_score: { type: 'string', description: 'Numeric score 0-100' },
          score_breakdown: { $ref: '#/components/schemas/ScoreBreakdown' },
          skill_gaps: { $ref: '#/components/schemas/SkillGaps' },
          github_signals: {
            type: 'object',
            nullable: true,
            properties: {
              username: { type: 'string' },
              publicRepoCount: { type: 'integer' },
              topLanguages: { type: 'array', items: { type: 'string' } },
              lastPushDate: { type: 'string', nullable: true },
              starredRepoCount: { type: 'integer' },
              hasDescriptiveRepos: { type: 'boolean' },
              hasForkedRepos: { type: 'boolean' },
              recentlyActive: { type: 'boolean' },
              profileBio: { type: 'string', nullable: true },
            },
          },
          roadmap: { type: 'string' },
          resume_suggestions: { type: 'string' },
          token_usage: { type: 'object' },
          github_url: { type: 'string', nullable: true },
          created_at: { type: 'string', format: 'date-time' },
          completed_at: { type: 'string', format: 'date-time', nullable: true },
        },
      },
      AnalysisSummary: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          status: { type: 'string', enum: ['pending', 'processing', 'completed', 'failed'] },
          overall_score: { type: 'string', nullable: true },
          created_at: { type: 'string', format: 'date-time' },
          completed_at: { type: 'string', format: 'date-time', nullable: true },
        },
      },
      AnalysisStatus: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          status: { type: 'string', enum: ['pending', 'processing', 'completed', 'failed'] },
          overall_score: { type: 'string', nullable: true },
          completed_at: { type: 'string', format: 'date-time', nullable: true },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        description: 'Pings the database and returns server health status.',
        responses: {
          '200': {
            description: 'Server is healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                    timestamp: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
          '503': {
            description: 'Server is unhealthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { status: { type: 'string', example: 'unhealthy' } },
                },
              },
            },
          },
        },
      },
    },
    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new user',
        description: 'Creates a new user account and returns a JWT token.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'name', 'password'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'user@example.com' },
                  name: { type: 'string', minLength: 2, maxLength: 100, example: 'Jane Doe' },
                  password: {
                    type: 'string',
                    minLength: 8,
                    description: 'Must contain at least one letter and one number',
                    example: 'SecurePass1',
                  },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'User registered successfully',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } },
          },
          '400': {
            description: 'Validation error',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          '409': {
            description: 'Email already registered',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login',
        description: 'Authenticates a user and returns a JWT token.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'user@example.com' },
                  password: { type: 'string', example: 'SecurePass1' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Login successful',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } },
          },
          '400': {
            description: 'Validation error',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          '401': {
            description: 'Invalid credentials',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/api/analyses': {
      post: {
        tags: ['Analyses'],
        summary: 'Create a new analysis',
        description:
          'Submits a resume and job description for analysis. The analysis is queued and processed in the background by a worker.',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['resume_text', 'job_description_text'],
                properties: {
                  resume_text: {
                    type: 'string',
                    minLength: 100,
                    maxLength: 50000,
                    description: 'Plain text resume content',
                    example:
                      'Senior Software Engineer with 5 years of experience in TypeScript, React, Node.js, PostgreSQL, and AWS. Led a team of 4 engineers building a real-time analytics dashboard.',
                  },
                  job_description_text: {
                    type: 'string',
                    minLength: 100,
                    maxLength: 50000,
                    description: 'Plain text job description',
                    example:
                      'We are looking for a Senior Full Stack Engineer. Requirements: TypeScript, React, Node.js, PostgreSQL. Preferred: AWS, Docker, GraphQL.',
                  },
                  github_url: {
                    type: 'string',
                    format: 'uri',
                    nullable: true,
                    description: 'Optional GitHub profile URL for additional signal analysis',
                    example: 'https://github.com/octocat',
                  },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Analysis queued',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    analysis_id: { type: 'string', format: 'uuid' },
                    status: { type: 'string', example: 'pending' },
                    message: { type: 'string' },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Validation error',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          '401': {
            description: 'Unauthorized - missing or invalid JWT',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          '429': {
            description: 'Daily analysis limit exceeded',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
      get: {
        tags: ['Analyses'],
        summary: 'List analyses',
        description: 'Returns a paginated list of analyses for the authenticated user.',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', default: 1, minimum: 1 },
            description: 'Page number',
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', default: 10, minimum: 1, maximum: 50 },
            description: 'Items per page',
          },
        ],
        responses: {
          '200': {
            description: 'Paginated list of analyses',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    analyses: { type: 'array', items: { $ref: '#/components/schemas/AnalysisSummary' } },
                    total: { type: 'integer' },
                    page: { type: 'integer' },
                    limit: { type: 'integer' },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/api/analyses/{id}': {
      get: {
        tags: ['Analyses'],
        summary: 'Get analysis by ID',
        description:
          'Returns the full analysis result including scores, skill gaps, roadmap, and resume suggestions.',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
            description: 'Analysis UUID',
          },
        ],
        responses: {
          '200': {
            description: 'Full analysis result',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/AnalysisFull' } } },
          },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          '404': {
            description: 'Analysis not found',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/api/analyses/{id}/status': {
      get: {
        tags: ['Analyses'],
        summary: 'Poll analysis status',
        description: 'Lightweight endpoint to check analysis progress without fetching full results.',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
            description: 'Analysis UUID',
          },
        ],
        responses: {
          '200': {
            description: 'Analysis status',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/AnalysisStatus' } } },
          },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          '404': {
            description: 'Analysis not found',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
  },
};
