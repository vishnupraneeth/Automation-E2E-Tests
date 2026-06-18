def failedStages = []

def createJiraTask(String summary, String statusEmoji, String detail) {
    def auth = "${env.JIRA_EMAIL}:${env.JIRA_API_TOKEN}".toString().bytes.encodeBase64().toString()

    def body = """
{
  "fields": {
    "project": { "key": "${env.JIRA_PROJECT_KEY}" },
    "summary": "${statusEmoji} ${summary} — Build #${env.BUILD_NUMBER}",
    "description": {
      "type": "doc",
      "version": 1,
      "content": [
        {
          "type": "paragraph",
          "content": [
            {
              "type": "text",
              "text": "${detail}"
            }
          ]
        }
      ]
    },
    "issuetype": { "name": "Task" }
  }
}
"""

    sh """
        curl -s -X POST \\
          -H "Authorization: Basic ${auth}" \\
          -H "Content-Type: application/json" \\
          --data '${body.replaceAll("'", "'\\''")}' \\
          "${env.JIRA_BASE_URL}/rest/api/3/issue" || true
    """
}

pipeline {
    agent any

    tools {
        nodejs 'NodeJS-20'
    }

    environment {
        ENV = 'dev'
        CI = 'true'
        JIRA_BASE_URL = 'https://vishnupraneeth96-1781416967185.atlassian.net'
        JIRA_EMAIL = 'vishnupraneeth96@gmail.com'
        JIRA_PROJECT_KEY = 'KAN'
        JIRA_API_TOKEN = credentials('jira-api-token')

        // ✅ FIX — this was missing, which is why LangChain always skipped AI analysis
        OPENAI_API_KEY = credentials('openai-api-key')
    }

    options {
        timestamps()
        timeout(time: 60, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '10'))
        disableConcurrentBuilds()
    }

    stages {

        stage('Install Dependencies') {
            steps {
                sh 'npm ci'
                sh 'npx playwright install chromium --with-deps'
            }
        }

        stage('UI Tests') {
            steps {
                catchError(buildResult: 'SUCCESS', stageResult: 'FAILURE') {
                    sh '''
                        npx playwright test \
                          tests/homepage.spec.ts \
                          tests/homepagefix.spec.ts \
                          tests/loginPage.spec.ts \
                          tests/loginpagefix.spec.ts \
                          tests/signupPage.spec.ts \
                          --project=chromium
                    '''
                }
            }
            post {
                always {
                    archiveArtifacts artifacts: 'test-results/**', allowEmptyArchive: true
                    archiveArtifacts artifacts: 'reports/html-report/**', allowEmptyArchive: true
                }
                unsuccessful {
                    script {
                        failedStages << 'UI Tests'
                    }
                }
            }
        }

        stage('API Tests') {
            steps {
                catchError(buildResult: 'SUCCESS', stageResult: 'FAILURE') {
                    sh 'npx playwright test tests/apiTests/ --project=api'
                }
            }
            post {
                always {
                    archiveArtifacts artifacts: 'test-results/**', allowEmptyArchive: true
                }
                unsuccessful {
                    script {
                        failedStages << 'API Tests'
                    }
                }
            }
        }

        stage('MCP Run - BDD Cart Test') {
            steps {
                catchError(buildResult: 'SUCCESS', stageResult: 'FAILURE') {
                    sh 'npx bddgen --config playwright.config.ts'
                    sh 'npx playwright test --project=bdd-chromium'
                }
            }
            post {
                always {
                    archiveArtifacts artifacts: 'test-results/**', allowEmptyArchive: true
                    archiveArtifacts artifacts: '.features-gen/**', allowEmptyArchive: true
                }
                unsuccessful {
                    script {
                        failedStages << 'BDD Cart Test'
                    }
                }
            }
        }
    }

    post {
        always {
            echo 'Generating Allure report...'

            sh 'npx allure generate allure-results --clean -o allure-report || true'

            archiveArtifacts artifacts: 'allure-report/**', allowEmptyArchive: true

            allure([
                includeProperties: false,
                jdk: '',
                results: [[path: 'allure-results']]
            ])

            script {
                if (failedStages.size() > 0) {
                    currentBuild.result = 'FAILURE'

                    createJiraTask(
                        '[CI Failure] Test Stages Failed',
                        '❌',
                        "Failed stages: ${failedStages.join(', ')}. Allure report generated. Build URL: ${env.BUILD_URL}"
                    )
                } else {
                    currentBuild.result = 'SUCCESS'
                }
            }
        }
    }
}