import { AgentState, HealingAttempt } from '../models/AgentState.js';
import { logger } from '../utils/logger.js';
import { writeFile, ensureDir } from '../utils/fileUtils.js';
import path from 'path';
import { constants } from '../config/env.js';

interface ReportData {
  timestamp: string;
  runId: string;
  scenario: string;
  userStory: string;
  geminiModel: string;
  executionStartTime: string;
  executionEndTime: string;
  executionDuration: number;
  initialExecutionStatus: 'PASSED' | 'FAILED';
  healingAttempts: number;
  healingSummary: string;
  finalExecutionStatus: 'PASSED' | 'FAILED';
  generatedTestPath: string;
  executionCommand: string;
  generatedFiles: string[];
  failureSummary?: string;
}

export class ReportAgent {
  async generateReport(state: AgentState): Promise<void> {
    logger.log('[REPORT] Generating final report');

    await ensureDir(constants.REPORTS_DIR);

    const reportData: ReportData = {
      timestamp: state.timestamp,
      runId: state.runId,
      scenario: state.testPlan?.scenarioName || 'Unknown',
      userStory: state.userStory,
      geminiModel: 'gemini-2.0-flash',
      executionStartTime: state.timestamp,
      executionEndTime: new Date().toISOString(),
      executionDuration: state.finalResult?.totalDuration || 0,
      initialExecutionStatus: state.initialExecutionResult?.passed ? 'PASSED' : 'FAILED',
      healingAttempts: state.healingAttempts.length,
      healingSummary: this.generateHealingSummary(state.healingAttempts),
      finalExecutionStatus: state.finalResult?.status || 'FAILED',
      generatedTestPath: state.generationResult?.testFile
        ? path.join(constants.GENERATED_DIR, 'tests', state.generationResult.testFile)
        : '',
      executionCommand:
        state.currentExecutionResult?.executionCommand ||
        state.initialExecutionResult?.executionCommand ||
        '',
      generatedFiles: state.generationResult?.pageObjectFiles || [],
      failureSummary:
        state.currentExecutionResult?.error || state.initialExecutionResult?.error || undefined,
    };

    // Generate JSON report
    await this.saveJsonReport(reportData);

    // Generate HTML report
    await this.saveHtmlReport(reportData);

    logger.log('[REPORT] Report generated successfully');
  }

  private async saveJsonReport(data: ReportData): Promise<void> {
    const jsonPath = path.join(constants.REPORTS_DIR, 'final-report.json');
    const jsonContent = JSON.stringify(data, null, 2);
    await writeFile(jsonPath, jsonContent);
    logger.log('[REPORT] JSON report saved:', jsonPath);
  }

  private async saveHtmlReport(data: ReportData): Promise<void> {
    const htmlPath = path.join(constants.REPORTS_DIR, 'final-report.html');
    const htmlContent = this.generateHtmlContent(data);
    await writeFile(htmlPath, htmlContent);
    logger.log('[REPORT] HTML report saved:', htmlPath);
  }

  private generateHtmlContent(data: ReportData): string {
    const statusColor = data.finalExecutionStatus === 'PASSED' ? '#28a745' : '#dc3545';

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Autonomous AI Test Report</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
                'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica',
                'Arial', sans-serif;
            background: #f5f5f5;
            color: #333;
            line-height: 1.6;
        }
        .container {
            max-width: 900px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: white;
            padding: 30px;
            border-radius: 8px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .title {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .status-badge {
            display: inline-block;
            padding: 8px 16px;
            border-radius: 4px;
            color: white;
            font-weight: bold;
            background-color: ${statusColor};
            margin-bottom: 10px;
        }
        .section {
            background: white;
            padding: 20px;
            margin-bottom: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .section-title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 15px;
            border-bottom: 2px solid #007bff;
            padding-bottom: 10px;
        }
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 15px;
        }
        .info-item {
            padding: 10px;
            background: #f8f9fa;
            border-radius: 4px;
            border-left: 3px solid #007bff;
        }
        .info-label {
            font-size: 12px;
            font-weight: bold;
            color: #666;
            text-transform: uppercase;
            margin-bottom: 5px;
        }
        .info-value {
            font-size: 16px;
            color: #333;
        }
        .metric {
            text-align: center;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 4px;
            margin-bottom: 10px;
        }
        .metric-value {
            font-size: 24px;
            font-weight: bold;
            color: ${statusColor};
        }
        .metric-label {
            font-size: 12px;
            color: #666;
            text-transform: uppercase;
            margin-top: 5px;
        }
        .timeline {
            display: flex;
            gap: 10px;
            margin: 20px 0;
        }
        .timeline-item {
            flex: 1;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 4px;
            text-align: center;
            border: 2px solid #ddd;
        }
        .timeline-item.active {
            border-color: ${statusColor};
            background: ${statusColor}22;
        }
        .timeline-label {
            font-size: 12px;
            font-weight: bold;
            color: #666;
        }
        .failure-details {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            border-radius: 4px;
            margin-top: 10px;
        }
        .failure-details.error {
            background: #f8d7da;
            border-left-color: #dc3545;
        }
        .footer {
            text-align: center;
            padding: 20px;
            color: #999;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="title">Autonomous AI Test Automation Report</div>
            <div class="status-badge">${data.finalExecutionStatus}</div>
            <p><strong>Scenario:</strong> ${data.scenario}</p>
            <p><strong>Run ID:</strong> ${data.runId}</p>
            <p><strong>Generated:</strong> ${new Date(data.timestamp).toLocaleString()}</p>
        </div>

        <div class="section">
            <div class="section-title">Executive Summary</div>
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">Status</div>
                    <div class="info-value" style="color: ${statusColor};">${data.finalExecutionStatus}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Duration</div>
                    <div class="info-value">${(data.executionDuration / 1000).toFixed(2)}s</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Healing Attempts</div>
                    <div class="info-value">${data.healingAttempts}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">AI Model</div>
                    <div class="info-value">${data.geminiModel}</div>
                </div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">Test Details</div>
            <div class="info-grid">
                <div class="info-item" style="grid-column: 1 / -1;">
                    <div class="info-label">User Story</div>
                    <div class="info-value">${data.userStory}</div>
                </div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">Execution Flow</div>
            <div class="timeline">
                <div class="timeline-item ${data.initialExecutionStatus === 'PASSED' ? 'active' : ''}">
                    <div class="timeline-label">Initial Execution</div>
                    <div class="metric-value">${data.initialExecutionStatus}</div>
                </div>
                ${
                  data.healingAttempts > 0
                    ? `
                <div class="timeline-item ${data.healingAttempts > 0 ? 'active' : ''}">
                    <div class="timeline-label">Healing</div>
                    <div class="metric-value">${data.healingAttempts}</div>
                </div>
                `
                    : ''
                }
                <div class="timeline-item ${data.finalExecutionStatus === 'PASSED' ? 'active' : ''}">
                    <div class="timeline-label">Final Execution</div>
                    <div class="metric-value">${data.finalExecutionStatus}</div>
                </div>
            </div>
            ${
              data.healingAttempts > 0
                ? `
            <div class="info-item">
                <div class="info-label">Healing Summary</div>
                <div class="info-value">${data.healingSummary}</div>
            </div>
            `
                : ''
            }
        </div>

        ${
          data.failureSummary && data.finalExecutionStatus === 'FAILED'
            ? `
        <div class="section">
            <div class="section-title">Failure Analysis</div>
            <div class="failure-details error">
                <strong>Error:</strong><br>
                <pre>${data.failureSummary.substring(0, 500)}</pre>
            </div>
        </div>
        `
            : ''
        }

        <div class="section">
            <div class="section-title">Generated Files</div>
            <ul style="list-style: none; padding: 0;">
                ${data.generatedFiles.map((f) => `<li>✓ ${f}</li>`).join('')}
            </ul>
        </div>

        <div class="footer">
            <p>This report was generated by the Autonomous AI Test Automation Agent</p>
            <p>All credentials and sensitive information have been masked</p>
        </div>
    </div>
</body>
</html>
    `;
  }

  private generateHealingSummary(attempts: HealingAttempt[]): string {
    if (attempts.length === 0) {
      return 'No healing attempts required';
    }

    return attempts.map((a) => `Attempt ${a.attemptNumber}: ${a.diagnosis}`).join('; ');
  }
}
