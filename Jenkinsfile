// ─────────────────────────────────────────────────────────────────────────────
// Jira helper — creates a Task in the KAN project via Jira REST API v3.
// Called from stage-level post{failure} blocks and the global post{success}.
//
// Jenkins setup required (one-time):
//   Manage Jenkins → Credentials → Add Secret Text with ID: jira-api-token
//   Value: the Atlassian API token stored in config/.env.dev
// ─────────────────────────────────────────────────────────────────────────────
def createJiraTask(String summary, String statusEmoji, String detail) {
    // JIRA_API_TOKEN is already in the environment (injected from Jenkins Credentials
    // via environment { JIRA_API_TOKEN = credentials('jira-api-token') }).
    // The same env var is also read by Playwright's JiraReporter.ts via dotenv.
    def auth   = "${env.JIRA_EMAIL}:${env.JIRA_API_TOKEN}".bytes.encodeBase64().toString()
    def body   = """
{
  "fields": {
    "project":     { "key": "${env.JIRA_PROJECT_KEY}" },
    "summary":     "${statusEmoji} ${summary} — Build #${env.BUILD_NUMBER}",
    "description": {
      "version": 1,
      "type": "doc",
      "content": [
        { "type": "heading", "attrs": { "level": 2 },
          "content": [{ "type": "text", "text": "CI Pipeline Details" }] },
        { "type": "bulletList",
          "content": [
            { "type": "listItem", "content": [{ "type": "paragraph",
                "content": [{ "type": "text", "text": "Job: ${env.JOB_NAME}" }] }] },
            { "type": "listItem", "content": [{ "type": "paragraph",
                "content": [{ "type": "text", "text": "Build: #${env.BUILD_NUMBER}" }] }] },
            { "type": "listItem", "content": [{ "type": "paragraph",
                "content": [{ "type": "text", "text": "Branch: ${env.GIT_BRANCH ?: 'N/A'}" }] }] },
            { "type": "listItem", "content": [{ "type": "paragraph",
                "content": [{ "type": "text", "text": "URL: ${env.BUILD_URL}" }] }] }
          ]
        },
        { "type": "heading", "attrs": { "level": 3 },
          "content": [{ "type": "text", "text": "Detail" }] },
        { "type": "paragraph",
          "content": [{ "type": "text", "text": "${detail}" }] },
        { "type": "paragraph",
          "content": [{ "type": "text",
            "text": "Auto-created by Jenkins JiraReporter stage." }] }
      ]
    },
    "issuetype": { "name": "Task" }
  }
}
"""
    def response = sh(
        script: """
            curl -s -w "\\n%{http_code}" -X POST \\
              -H "Authorization: Basic ${auth}" \\
              -H "Content-Type: application/json" \\
              -H "Accept: application/json" \\
              --data '${body.replaceAll("'", "'\\''")}' \\
              "${env.JIRA_BASE_URL}/rest/api/3/issue"
        """,
        returnStdout: true
    ).trim()

    def parts    = response.tokenize('\n')
    def httpCode = parts.last()
    def jsonBody = parts.dropRight(1).join('\n')

    if (httpCode.startsWith('2')) {
        def issueKey = readJSON(text: jsonBody).key
        echo "🐞 Jira task created: ${env.JIRA_BASE_URL}/browse/${issueKey}"
    } else {
        echo "⚠️  Jira API returned HTTP ${httpCode}: ${jsonBody}"
    }
}

pipeline {
    agent any

    tools {
        nodejs 'NodeJS-20'   // Configure in: Jenkins > Manage > Global Tool Configuration
    }

    environment {
        ENV              = 'dev'         // Loads config/.env.dev via playwright.config.ts
        CI               = 'true'        // Enables retries=2, workers=1 in playwright.config.ts
        JIRA_BASE_URL    = 'https://vishnupraneeth96-1781416967185.atlassian.net'
        JIRA_EMAIL       = 'vishnupraneeth96@gmail.com'
        JIRA_PROJECT_KEY = 'KAN'
        // Injected from Jenkins Credentials store (ID: jira-api-token).
        // This sets process.env.JIRA_API_TOKEN for both the Playwright JiraReporter
        // and the createJiraTask() Groovy helper — no need to store the token in .env.dev.
        JIRA_API_TOKEN   = credentials('jira-api-token')
    }

    options {
        timestamps()
        timeout(time: 60, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '10'))
        disableConcurrentBuilds()
    }

    stages {

        // ─────────────────────────────────────────────
        stage('Install Dependencies') {
        // ─────────────────────────────────────────────
            steps {
                // echo '📦 Installing npm dependencies...'
                // sh 'npm ci'

                echo '🌐 Installing Chromium browser...'
                sh 'npx playwright install chromium --with-deps'
            }
        }

        // ─────────────────────────────────────────────
        stage('UI Tests') {
        // ─────────────────────────────────────────────
            steps {
                echo '🖥️  Running UI tests on Chromium...'
                // catchError keeps the pipeline running so API tests always execute.
                // Final build result is still FAILURE if this stage fails.
                catchError(buildResult: 'FAILURE', stageResult: 'FAILURE') {
                    sh '''
                        npx playwright test \
                          tests/homepage.spec.ts       \
                          tests/homepagefix.spec.ts    \
                          tests/loginPage.spec.ts      \
                          tests/loginpagefix.spec.ts   \
                          tests/signupPage.spec.ts     \
                          --project=chromium
                    '''
                }
            }
            post {
                always {
                    echo '📊 Archiving UI test artifacts...'
                    archiveArtifacts artifacts: 'test-results/**',       allowEmptyArchive: true
                    archiveArtifacts artifacts: 'reports/html-report/**', allowEmptyArchive: true
                }
                failure {
                    echo '❌ UI Tests failed. Check screenshots/videos in archived artifacts.'
                    script {
                        createJiraTask(
                            '[CI Failure] UI Tests',
                            '❌',
                            'Playwright UI tests failed on Chromium. Check screenshots and videos in the archived test-results artifacts.'
                        )
                    }
                }
            }
        }

        // ─────────────────────────────────────────────
        stage('API Tests') {
        // ─────────────────────────────────────────────
            steps {
                echo '🔌 Running API tests...'
                catchError(buildResult: 'FAILURE', stageResult: 'FAILURE') {
                    sh 'npx playwright test tests/apiTests/ --project=api'
                }
            }
            post {
                always {
                    echo '📊 Archiving API test artifacts...'
                    archiveArtifacts artifacts: 'test-results/**', allowEmptyArchive: true
                }
                failure {
                    echo '❌ API Tests failed. Review response logs above.'
                    script {
                        createJiraTask(
                            '[CI Failure] API Tests',
                            '❌',
                            'Playwright API tests failed. Review the HTTP response logs in the Jenkins console output.'
                        )
                    }
                }
            }
        }

        // ─────────────────────────────────────────────
        stage('MCP Run - BDD Cart Test') {
        // ─────────────────────────────────────────────
            steps {
                echo '🤖 Running Playwright MCP BDD cart test (Gherkin feature)...'
                catchError(buildResult: 'FAILURE', stageResult: 'FAILURE') {
                    // Step 1: Generate Playwright test files from .feature + step definitions
                    sh 'npx bddgen --config playwright.config.ts'

                    // Step 2: Run the BDD project (features/cart.feature)
                    sh 'npx playwright test --project=bdd-chromium'
                }
            }
            post {
                always {
                    echo '📊 Archiving MCP BDD test artifacts...'
                    archiveArtifacts artifacts: 'test-results/**',        allowEmptyArchive: true
                    archiveArtifacts artifacts: '.features-gen/**',       allowEmptyArchive: true
                }
                success {
                    echo '✅ MCP BDD Cart Test passed!'
                }
                failure {
                    echo '❌ MCP BDD Cart Test failed. Check screenshots/videos in archived artifacts.'
                    script {
                        createJiraTask(
                            '[CI Failure] BDD Cart Test',
                            '❌',
                            'Playwright BDD (Gherkin) cart test failed. Check screenshots/videos in the archived .features-gen and test-results artifacts.'
                        )
                    }
                }
            }
        }

        // ─────────────────────────────────────────────
        stage('Generate Allure Report') {
        // ─────────────────────────────────────────────
            steps {
                echo '📈 Generating combined Allure report...'
                sh 'npx allure generate allure-results --clean -o allure-report'
            }
            post {
                always {
                    // Requires "Allure Jenkins Plugin" installed in Jenkins.
                    // Install via: Manage Jenkins > Plugins > Allure
                    allure([
                        includeProperties: false,
                        jdk: '',
                        results: [[path: 'allure-results']]
                    ])
                }
            }
        }
    }

    // ─────────────────────────────────────────────
    post {
    // ─────────────────────────────────────────────
        always {
            // sh 'rm -rf /root/.cache/ms-playwright || true'
            archiveArtifacts artifacts: 'allure-report/**', allowEmptyArchive: true
            // cleanWs()   // Clean workspace after each build
        }
        success {
            echo '✅ Pipeline completed — all UI and API tests passed!'
            script {
                createJiraTask(
                    '[CI Success] All Tests Passed',
                    '✅',
                    'All pipeline stages completed successfully: UI Tests, API Tests, BDD Cart Test, and Allure report generated.'
                )
            }
        }
        failure {
            echo '❌ Pipeline failed. Check stage logs and archived test artifacts.'
        }
    }
}

