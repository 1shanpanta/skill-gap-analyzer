"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import type { AnalysisFull } from "@/lib/types";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#1a1a1a",
  },
  title: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color: "#666",
    marginBottom: 20,
  },
  scoreContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  scoreCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: "#3b82f6",
    alignItems: "center",
    justifyContent: "center",
  },
  scoreText: {
    fontSize: 24,
    fontFamily: "Helvetica-Bold",
  },
  scoreLabel: {
    fontSize: 9,
    color: "#666",
    marginTop: 4,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
  },
  label: {
    fontSize: 10,
    color: "#444",
  },
  value: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
  },
  skillTag: {
    backgroundColor: "#f0f9ff",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 4,
    marginBottom: 4,
    fontSize: 9,
    color: "#1e40af",
  },
  missingTag: {
    backgroundColor: "#fef2f2",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 4,
    marginBottom: 4,
    fontSize: 9,
    color: "#991b1b",
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  bodyText: {
    fontSize: 10,
    lineHeight: 1.5,
    color: "#333",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 8,
    color: "#999",
    textAlign: "center",
  },
});

interface AnalysisPDFProps {
  analysis: AnalysisFull;
}

export function AnalysisPDF({ analysis }: AnalysisPDFProps) {
  const score = analysis.overall_score
    ? parseFloat(analysis.overall_score)
    : null;
  const breakdown = analysis.score_breakdown;
  const gaps = analysis.skill_gaps;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Skill Gap Analysis Report</Text>
        <Text style={styles.subtitle}>
          Generated{" "}
          {analysis.completed_at
            ? new Date(analysis.completed_at).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })
            : "recently"}
          {"  |  "}ID: {analysis.id.slice(0, 8)}
        </Text>

        {/* Overall Score */}
        {score !== null && (
          <View style={styles.scoreContainer}>
            <View style={styles.scoreCircle}>
              <Text style={styles.scoreText}>{Math.round(score)}</Text>
            </View>
            <Text style={styles.scoreLabel}>Overall Match Score</Text>
          </View>
        )}

        {/* Score Breakdown */}
        {breakdown && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Score Breakdown</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Skill Match</Text>
              <Text style={styles.value}>
                {breakdown.skill_match.toFixed(1)}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Seniority Alignment</Text>
              <Text style={styles.value}>
                {breakdown.seniority_alignment.toFixed(1)}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>GitHub Signal</Text>
              <Text style={styles.value}>
                {breakdown.github_signal.toFixed(1)}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Bonus Factors</Text>
              <Text style={styles.value}>
                {breakdown.bonus_factors.toFixed(1)}
              </Text>
            </View>
          </View>
        )}

        {/* Skill Gaps */}
        {gaps && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Skills Analysis</Text>

            {gaps.matchedSkills.length > 0 && (
              <View style={{ marginBottom: 8 }}>
                <Text style={[styles.label, { marginBottom: 4 }]}>
                  Matched Skills ({gaps.matchedSkills.length})
                </Text>
                <View style={styles.tagRow}>
                  {gaps.matchedSkills.map((skill) => (
                    <Text key={skill} style={styles.skillTag}>
                      {skill}
                    </Text>
                  ))}
                </View>
              </View>
            )}

            {gaps.missingRequired.length > 0 && (
              <View style={{ marginBottom: 8 }}>
                <Text style={[styles.label, { marginBottom: 4 }]}>
                  Missing Required ({gaps.missingRequired.length})
                </Text>
                <View style={styles.tagRow}>
                  {gaps.missingRequired.map((skill) => (
                    <Text key={skill} style={styles.missingTag}>
                      {skill}
                    </Text>
                  ))}
                </View>
              </View>
            )}

            {gaps.missingPreferred.length > 0 && (
              <View style={{ marginBottom: 8 }}>
                <Text style={[styles.label, { marginBottom: 4 }]}>
                  Missing Preferred ({gaps.missingPreferred.length})
                </Text>
                <View style={styles.tagRow}>
                  {gaps.missingPreferred.map((skill) => (
                    <Text key={skill} style={styles.missingTag}>
                      {skill}
                    </Text>
                  ))}
                </View>
              </View>
            )}

            {gaps.extraSkills.length > 0 && (
              <View style={{ marginBottom: 8 }}>
                <Text style={[styles.label, { marginBottom: 4 }]}>
                  Extra Skills ({gaps.extraSkills.length})
                </Text>
                <View style={styles.tagRow}>
                  {gaps.extraSkills.map((skill) => (
                    <Text key={skill} style={styles.skillTag}>
                      {skill}
                    </Text>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        {/* Roadmap (plain text, truncated for PDF) */}
        {analysis.roadmap && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Learning Roadmap</Text>
            <Text style={styles.bodyText}>
              {analysis.roadmap.slice(0, 2000)}
              {analysis.roadmap.length > 2000 ? "\n\n[Truncated — see full version in app]" : ""}
            </Text>
          </View>
        )}

        {/* Resume Suggestions */}
        {analysis.resume_suggestions && (
          <View style={styles.section} break>
            <Text style={styles.sectionTitle}>Resume Suggestions</Text>
            <Text style={styles.bodyText}>
              {analysis.resume_suggestions.slice(0, 2000)}
              {analysis.resume_suggestions.length > 2000
                ? "\n\n[Truncated — see full version in app]"
                : ""}
            </Text>
          </View>
        )}

        <Text style={styles.footer}>
          Skill Gap Analyzer — Confidential Report
        </Text>
      </Page>
    </Document>
  );
}
