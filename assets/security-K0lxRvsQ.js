import{n as e}from"./motion-C16f7Ten.js";var t=e();function n(e){let n={a:`a`,annotation:`annotation`,code:`code`,h2:`h2`,h3:`h3`,h4:`h4`,li:`li`,math:`math`,mi:`mi`,mn:`mn`,mo:`mo`,mrow:`mrow`,msub:`msub`,msup:`msup`,munderover:`munderover`,ol:`ol`,p:`p`,pre:`pre`,semantics:`semantics`,span:`span`,strong:`strong`,table:`table`,tbody:`tbody`,td:`td`,th:`th`,thead:`thead`,tr:`tr`,ul:`ul`,...e.components};return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)(n.p,{children:`Pastoralist can check dependencies against security providers and connect fixes
to the same appendix used for override tracking.`}),`
`,(0,t.jsx)(n.h2,{id:`overview`,children:`Overview`}),`
`,(0,t.jsx)(n.p,{children:`Security checks scan your dependencies, report vulnerable packages, and can
suggest or apply package manager overrides when a safe version is available. The
appendix keeps the CVE, provider, severity, patched version, and reason with the
override.`}),`
`,(0,t.jsx)(n.h2,{id:`quick-start`,children:`Quick Start`}),`
`,(0,t.jsx)(n.h3,{id:`basic-check`,children:`Basic Check`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`# Check for vulnerabilities and display a report
pastoralist --checkSecurity
`})}),`
`,(0,t.jsx)(n.h3,{id:`auto-fix`,children:`Auto Fix`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`# Automatically apply security fixes
pastoralist --checkSecurity --forceSecurityRefactor
`})}),`
`,(0,t.jsx)(n.h3,{id:`interactive`,children:`Interactive`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`# Choose which fixes to apply
pastoralist --checkSecurity --interactive
`})}),`
`,(0,t.jsx)(n.h3,{id:`workspaces`,children:`Workspaces`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`# Include workspace packages in the scan
pastoralist --checkSecurity --hasWorkspaceSecurityChecks
`})}),`
`,(0,t.jsx)(`a`,{href:`https://stackblitz.com/fork/github/yowainwright/pastoralist/tree/main/tests/sandboxes/security-scan?title=Pastoralist%20Security%20Scan&file=README.md&startScript=demo&view=editor`,target:`_blank`,rel:`noopener noreferrer`,children:(0,t.jsx)(`img`,{src:`https://developer.stackblitz.com/img/open_in_stackblitz.svg`,alt:`Open in StackBlitz`})}),`
`,(0,t.jsx)(n.h2,{id:`configuration`,children:`Configuration`}),`
`,(0,t.jsxs)(n.p,{children:[`You can configure security settings in your `,(0,t.jsx)(n.code,{children:`package.json`}),`:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-json`,children:`{
  "pastoralist": {
    "security": {
      "enabled": false,
      "provider": "osv",
      "autoFix": false,
      "interactive": false,
      "hasWorkspaceSecurityChecks": false,
      "severityThreshold": "medium",
      "excludePackages": []
    },
    "bestCase": {
      "enabled": false,
      "userOwnedOverrides": []
    }
  }
}
`})}),`
`,(0,t.jsx)(n.h3,{id:`configuration-options`,children:`Configuration Options`}),`
`,(0,t.jsxs)(n.table,{children:[(0,t.jsx)(n.thead,{children:(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.th,{children:`Option`}),(0,t.jsx)(n.th,{children:`Type`}),(0,t.jsx)(n.th,{children:`Default`}),(0,t.jsx)(n.th,{children:`Description`})]})}),(0,t.jsxs)(n.tbody,{children:[(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`enabled`})}),(0,t.jsx)(n.td,{children:`boolean`}),(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`false`})}),(0,t.jsx)(n.td,{children:`Enable automatic security checks when running pastoralist`})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`provider`})}),(0,t.jsx)(n.td,{children:`string or array`}),(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`"osv"`})}),(0,t.jsxs)(n.td,{children:[`Provider: `,(0,t.jsx)(n.code,{children:`"osv"`}),`, `,(0,t.jsx)(n.code,{children:`"github"`}),`, `,(0,t.jsx)(n.code,{children:`"npm"`}),`, `,(0,t.jsx)(n.code,{children:`"snyk"`}),` [EXPERIMENTAL], `,(0,t.jsx)(n.code,{children:`"socket"`}),` [EXPERIMENTAL], `,(0,t.jsx)(n.code,{children:`"spektion"`}),` [EXPERIMENTAL]`]})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`autoFix`})}),(0,t.jsx)(n.td,{children:`boolean`}),(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`false`})}),(0,t.jsx)(n.td,{children:`Automatically apply security fixes without prompting`})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`interactive`})}),(0,t.jsx)(n.td,{children:`boolean`}),(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`false`})}),(0,t.jsx)(n.td,{children:`Use interactive mode to select which fixes to apply`})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`securityProviderToken`})}),(0,t.jsx)(n.td,{children:`string`}),(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`""`})}),(0,t.jsx)(n.td,{children:`Authentication token for providers that require it. Prefer provider environment variables; use this only for controlled config that will not be committed.`})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`hasWorkspaceSecurityChecks`})}),(0,t.jsx)(n.td,{children:`boolean`}),(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`false`})}),(0,t.jsx)(n.td,{children:`Include workspace packages in security scan`})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`severityThreshold`})}),(0,t.jsx)(n.td,{children:`string`}),(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`"medium"`})}),(0,t.jsx)(n.td,{children:`Minimum severity level to report (low, medium, high, critical)`})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`excludePackages`})}),(0,t.jsx)(n.td,{children:`array`}),(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`[]`})}),(0,t.jsx)(n.td,{children:`List of package names to exclude from security checks`})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`strict`})}),(0,t.jsx)(n.td,{children:`boolean`}),(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`false`})}),(0,t.jsx)(n.td,{children:`Fail when a provider cannot complete`})]})]})]}),`
`,(0,t.jsx)(n.h3,{id:`best-case-portfolio-selection`,children:`Best-Case Portfolio Selection`}),`
`,(0,t.jsxs)(n.p,{children:[`Independent upgrades can interact: one package fix may introduce a
vulnerability or compatibility failure in another package. Enable `,(0,t.jsx)(n.code,{children:`bestCase`}),`
to rank complete package-version portfolios under one policy:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-json`,children:`{
  "pastoralist": {
    "checkSecurity": true,
    "bestCase": {
      "enabled": true,
      "riskAggregation": "both",
      "search": {
        "mode": "auto",
        "exactStateLimit": 256,
        "beamWidth": 16,
        "maxEvaluations": 1000
      }
    }
  }
}
`})}),`
`,(0,t.jsxs)(n.p,{children:[`Each patchable package contributes its current version, known patched versions,
and latest compatible version. Auto mode exhaustively evaluates small products
and uses deterministic beam search above the configured cap. The result includes
the selected state, decision ID, policy hash, vulnerability impact, duration,
evaluated-state count, and `,(0,t.jsx)(n.code,{children:`provenOptimal`}),` status.`]}),`
`,(0,t.jsx)(n.p,{children:`Declare a package as user-owned when its active override must win over portfolio
ranking. Interactive mode also prompts before promoting a newer independent
security update and persists an approved package name.`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-json`,children:`{
  "overrides": {
    "alpha": "2.5.0"
  },
  "pastoralist": {
    "bestCase": {
      "enabled": true,
      "userOwnedOverrides": ["alpha"]
    },
    "appendix": {
      "alpha@2.5.0": {
        "ledger": {
          "addedDate": "2026-08-09T00:00:00.000Z"
        }
      }
    }
  }
}
`})}),`
`,(0,t.jsxs)(n.p,{children:[(0,t.jsx)(n.code,{children:`userOwnedOverrides`}),` is the machine-readable ownership declaration. The active
override supplies the constrained version. The ledger `,(0,t.jsx)(n.code,{children:`addedDate`}),` is displayed
as the human-facing “user-owned since” signal, but does not establish ownership
by itself.`]}),`
`,(0,t.jsxs)(n.p,{children:[`The built-in evaluator scans all root packages and candidate-controlled
packages. Projects that materialize lockfiles, solve peer constraints, or model
version-combination behavior can pass a whole-state `,(0,t.jsx)(n.code,{children:`bestCaseEvaluator`}),` through
the Node.js API.`]}),`
`,(0,t.jsx)(n.h4,{id:`formal-model`,children:`Formal Model`}),`
`,(0,t.jsxs)(n.p,{children:[`Package `,(0,t.jsxs)(n.span,{className:`katex`,children:[(0,t.jsx)(n.span,{className:`katex-mathml`,children:(0,t.jsx)(n.math,{xmlns:`http://www.w3.org/1998/Math/MathML`,children:(0,t.jsxs)(n.semantics,{children:[(0,t.jsx)(n.mrow,{children:(0,t.jsx)(n.mi,{children:`i`})}),(0,t.jsx)(n.annotation,{encoding:`application/x-tex`,children:`i`})]})})}),(0,t.jsx)(n.span,{className:`katex-html`,"aria-hidden":`true`,children:(0,t.jsxs)(n.span,{className:`base`,children:[(0,t.jsx)(n.span,{className:`strut`,style:{height:`0.6595em`}}),(0,t.jsx)(n.span,{className:`mord mathnormal`,children:`i`})]})})]}),` contributes a set of candidate versions `,(0,t.jsxs)(n.span,{className:`katex`,children:[(0,t.jsx)(n.span,{className:`katex-mathml`,children:(0,t.jsx)(n.math,{xmlns:`http://www.w3.org/1998/Math/MathML`,children:(0,t.jsxs)(n.semantics,{children:[(0,t.jsx)(n.mrow,{children:(0,t.jsxs)(n.msub,{children:[(0,t.jsx)(n.mi,{children:`V`}),(0,t.jsx)(n.mi,{children:`i`})]})}),(0,t.jsx)(n.annotation,{encoding:`application/x-tex`,children:`V_i`})]})})}),(0,t.jsx)(n.span,{className:`katex-html`,"aria-hidden":`true`,children:(0,t.jsxs)(n.span,{className:`base`,children:[(0,t.jsx)(n.span,{className:`strut`,style:{height:`0.8333em`,verticalAlign:`-0.15em`}}),(0,t.jsxs)(n.span,{className:`mord`,children:[(0,t.jsx)(n.span,{className:`mord mathnormal`,style:{marginRight:`0.2222em`},children:`V`}),(0,t.jsx)(n.span,{className:`msupsub`,children:(0,t.jsxs)(n.span,{className:`vlist-t vlist-t2`,children:[(0,t.jsxs)(n.span,{className:`vlist-r`,children:[(0,t.jsx)(n.span,{className:`vlist`,style:{height:`0.3117em`},children:(0,t.jsxs)(n.span,{style:{top:`-2.55em`,marginLeft:`-0.2222em`,marginRight:`0.05em`},children:[(0,t.jsx)(n.span,{className:`pstrut`,style:{height:`2.7em`}}),(0,t.jsx)(n.span,{className:`sizing reset-size6 size3 mtight`,children:(0,t.jsx)(n.span,{className:`mord mathnormal mtight`,children:`i`})})]})}),(0,t.jsx)(n.span,{className:`vlist-s`,children:`​`})]}),(0,t.jsx)(n.span,{className:`vlist-r`,children:(0,t.jsx)(n.span,{className:`vlist`,style:{height:`0.15em`},children:(0,t.jsx)(n.span,{})})})]})})]})]})})]}),`. The complete search
space is the Cartesian product of those sets:`]}),`
`,(0,t.jsx)(n.span,{className:`katex-display`,children:(0,t.jsxs)(n.span,{className:`katex`,children:[(0,t.jsx)(n.span,{className:`katex-mathml`,children:(0,t.jsx)(n.math,{xmlns:`http://www.w3.org/1998/Math/MathML`,display:`block`,children:(0,t.jsxs)(n.semantics,{children:[(0,t.jsxs)(n.mrow,{children:[(0,t.jsx)(n.mi,{mathvariant:`script`,children:`X`}),(0,t.jsx)(n.mo,{children:`=`}),(0,t.jsxs)(n.munderover,{children:[(0,t.jsx)(n.mo,{children:`∏`}),(0,t.jsxs)(n.mrow,{children:[(0,t.jsx)(n.mi,{children:`i`}),(0,t.jsx)(n.mo,{children:`=`}),(0,t.jsx)(n.mn,{children:`1`})]}),(0,t.jsx)(n.mi,{children:`n`})]}),(0,t.jsxs)(n.msub,{children:[(0,t.jsx)(n.mi,{children:`V`}),(0,t.jsx)(n.mi,{children:`i`})]})]}),(0,t.jsx)(n.annotation,{encoding:`application/x-tex`,children:`\\mathcal{X} = \\prod_{i=1}^{n} V_i`})]})})}),(0,t.jsxs)(n.span,{className:`katex-html`,"aria-hidden":`true`,children:[(0,t.jsxs)(n.span,{className:`base`,children:[(0,t.jsx)(n.span,{className:`strut`,style:{height:`0.6833em`}}),(0,t.jsx)(n.span,{className:`mord mathcal`,style:{marginRight:`0.1464em`},children:`X`}),(0,t.jsx)(n.span,{className:`mspace`,style:{marginRight:`0.2778em`}}),(0,t.jsx)(n.span,{className:`mrel`,children:`=`}),(0,t.jsx)(n.span,{className:`mspace`,style:{marginRight:`0.2778em`}})]}),(0,t.jsxs)(n.span,{className:`base`,children:[(0,t.jsx)(n.span,{className:`strut`,style:{height:`2.9291em`,verticalAlign:`-1.2777em`}}),(0,t.jsx)(n.span,{className:`mop op-limits`,children:(0,t.jsxs)(n.span,{className:`vlist-t vlist-t2`,children:[(0,t.jsxs)(n.span,{className:`vlist-r`,children:[(0,t.jsxs)(n.span,{className:`vlist`,style:{height:`1.6514em`},children:[(0,t.jsxs)(n.span,{style:{top:`-1.8723em`,marginLeft:`0em`},children:[(0,t.jsx)(n.span,{className:`pstrut`,style:{height:`3.05em`}}),(0,t.jsx)(n.span,{className:`sizing reset-size6 size3 mtight`,children:(0,t.jsxs)(n.span,{className:`mord mtight`,children:[(0,t.jsx)(n.span,{className:`mord mathnormal mtight`,children:`i`}),(0,t.jsx)(n.span,{className:`mrel mtight`,children:`=`}),(0,t.jsx)(n.span,{className:`mord mtight`,children:`1`})]})})]}),(0,t.jsxs)(n.span,{style:{top:`-3.05em`},children:[(0,t.jsx)(n.span,{className:`pstrut`,style:{height:`3.05em`}}),(0,t.jsx)(n.span,{children:(0,t.jsx)(n.span,{className:`mop op-symbol large-op`,children:`∏`})})]}),(0,t.jsxs)(n.span,{style:{top:`-4.3em`,marginLeft:`0em`},children:[(0,t.jsx)(n.span,{className:`pstrut`,style:{height:`3.05em`}}),(0,t.jsx)(n.span,{className:`sizing reset-size6 size3 mtight`,children:(0,t.jsx)(n.span,{className:`mord mtight`,children:(0,t.jsx)(n.span,{className:`mord mathnormal mtight`,children:`n`})})})]})]}),(0,t.jsx)(n.span,{className:`vlist-s`,children:`​`})]}),(0,t.jsx)(n.span,{className:`vlist-r`,children:(0,t.jsx)(n.span,{className:`vlist`,style:{height:`1.2777em`},children:(0,t.jsx)(n.span,{})})})]})}),(0,t.jsx)(n.span,{className:`mspace`,style:{marginRight:`0.1667em`}}),(0,t.jsxs)(n.span,{className:`mord`,children:[(0,t.jsx)(n.span,{className:`mord mathnormal`,style:{marginRight:`0.2222em`},children:`V`}),(0,t.jsx)(n.span,{className:`msupsub`,children:(0,t.jsxs)(n.span,{className:`vlist-t vlist-t2`,children:[(0,t.jsxs)(n.span,{className:`vlist-r`,children:[(0,t.jsx)(n.span,{className:`vlist`,style:{height:`0.3117em`},children:(0,t.jsxs)(n.span,{style:{top:`-2.55em`,marginLeft:`-0.2222em`,marginRight:`0.05em`},children:[(0,t.jsx)(n.span,{className:`pstrut`,style:{height:`2.7em`}}),(0,t.jsx)(n.span,{className:`sizing reset-size6 size3 mtight`,children:(0,t.jsx)(n.span,{className:`mord mathnormal mtight`,children:`i`})})]})}),(0,t.jsx)(n.span,{className:`vlist-s`,children:`​`})]}),(0,t.jsx)(n.span,{className:`vlist-r`,children:(0,t.jsx)(n.span,{className:`vlist`,style:{height:`0.15em`},children:(0,t.jsx)(n.span,{})})})]})})]})]})]})]})}),`
`,(0,t.jsxs)(n.p,{children:[`Let `,(0,t.jsxs)(n.span,{className:`katex`,children:[(0,t.jsx)(n.span,{className:`katex-mathml`,children:(0,t.jsx)(n.math,{xmlns:`http://www.w3.org/1998/Math/MathML`,children:(0,t.jsxs)(n.semantics,{children:[(0,t.jsxs)(n.mrow,{children:[(0,t.jsx)(n.mi,{children:`π`}),(0,t.jsx)(n.mo,{children:`=`}),(0,t.jsx)(n.mo,{stretchy:`false`,children:`(`}),(0,t.jsxs)(n.msub,{children:[(0,t.jsx)(n.mi,{children:`o`}),(0,t.jsx)(n.mn,{children:`1`})]}),(0,t.jsx)(n.mo,{separator:`true`,children:`,`}),(0,t.jsx)(n.mo,{children:`…`}),(0,t.jsx)(n.mo,{separator:`true`,children:`,`}),(0,t.jsxs)(n.msub,{children:[(0,t.jsx)(n.mi,{children:`o`}),(0,t.jsx)(n.mi,{children:`m`})]}),(0,t.jsx)(n.mo,{separator:`true`,children:`,`}),(0,t.jsx)(n.mi,{children:`a`}),(0,t.jsx)(n.mo,{stretchy:`false`,children:`)`})]}),(0,t.jsx)(n.annotation,{encoding:`application/x-tex`,children:`\\pi = (o_1, \\ldots, o_m, a)`})]})})}),(0,t.jsxs)(n.span,{className:`katex-html`,"aria-hidden":`true`,children:[(0,t.jsxs)(n.span,{className:`base`,children:[(0,t.jsx)(n.span,{className:`strut`,style:{height:`0.4306em`}}),(0,t.jsx)(n.span,{className:`mord mathnormal`,style:{marginRight:`0.0359em`},children:`π`}),(0,t.jsx)(n.span,{className:`mspace`,style:{marginRight:`0.2778em`}}),(0,t.jsx)(n.span,{className:`mrel`,children:`=`}),(0,t.jsx)(n.span,{className:`mspace`,style:{marginRight:`0.2778em`}})]}),(0,t.jsxs)(n.span,{className:`base`,children:[(0,t.jsx)(n.span,{className:`strut`,style:{height:`1em`,verticalAlign:`-0.25em`}}),(0,t.jsx)(n.span,{className:`mopen`,children:`(`}),(0,t.jsxs)(n.span,{className:`mord`,children:[(0,t.jsx)(n.span,{className:`mord mathnormal`,children:`o`}),(0,t.jsx)(n.span,{className:`msupsub`,children:(0,t.jsxs)(n.span,{className:`vlist-t vlist-t2`,children:[(0,t.jsxs)(n.span,{className:`vlist-r`,children:[(0,t.jsx)(n.span,{className:`vlist`,style:{height:`0.3011em`},children:(0,t.jsxs)(n.span,{style:{top:`-2.55em`,marginLeft:`0em`,marginRight:`0.05em`},children:[(0,t.jsx)(n.span,{className:`pstrut`,style:{height:`2.7em`}}),(0,t.jsx)(n.span,{className:`sizing reset-size6 size3 mtight`,children:(0,t.jsx)(n.span,{className:`mord mtight`,children:`1`})})]})}),(0,t.jsx)(n.span,{className:`vlist-s`,children:`​`})]}),(0,t.jsx)(n.span,{className:`vlist-r`,children:(0,t.jsx)(n.span,{className:`vlist`,style:{height:`0.15em`},children:(0,t.jsx)(n.span,{})})})]})})]}),(0,t.jsx)(n.span,{className:`mpunct`,children:`,`}),(0,t.jsx)(n.span,{className:`mspace`,style:{marginRight:`0.1667em`}}),(0,t.jsx)(n.span,{className:`minner`,children:`…`}),(0,t.jsx)(n.span,{className:`mspace`,style:{marginRight:`0.1667em`}}),(0,t.jsx)(n.span,{className:`mpunct`,children:`,`}),(0,t.jsx)(n.span,{className:`mspace`,style:{marginRight:`0.1667em`}}),(0,t.jsxs)(n.span,{className:`mord`,children:[(0,t.jsx)(n.span,{className:`mord mathnormal`,children:`o`}),(0,t.jsx)(n.span,{className:`msupsub`,children:(0,t.jsxs)(n.span,{className:`vlist-t vlist-t2`,children:[(0,t.jsxs)(n.span,{className:`vlist-r`,children:[(0,t.jsx)(n.span,{className:`vlist`,style:{height:`0.1514em`},children:(0,t.jsxs)(n.span,{style:{top:`-2.55em`,marginLeft:`0em`,marginRight:`0.05em`},children:[(0,t.jsx)(n.span,{className:`pstrut`,style:{height:`2.7em`}}),(0,t.jsx)(n.span,{className:`sizing reset-size6 size3 mtight`,children:(0,t.jsx)(n.span,{className:`mord mathnormal mtight`,children:`m`})})]})}),(0,t.jsx)(n.span,{className:`vlist-s`,children:`​`})]}),(0,t.jsx)(n.span,{className:`vlist-r`,children:(0,t.jsx)(n.span,{className:`vlist`,style:{height:`0.15em`},children:(0,t.jsx)(n.span,{})})})]})})]}),(0,t.jsx)(n.span,{className:`mpunct`,children:`,`}),(0,t.jsx)(n.span,{className:`mspace`,style:{marginRight:`0.1667em`}}),(0,t.jsx)(n.span,{className:`mord mathnormal`,children:`a`}),(0,t.jsx)(n.span,{className:`mclose`,children:`)`})]})]})]}),` be the resolved policy, where each `,(0,t.jsxs)(n.span,{className:`katex`,children:[(0,t.jsx)(n.span,{className:`katex-mathml`,children:(0,t.jsx)(n.math,{xmlns:`http://www.w3.org/1998/Math/MathML`,children:(0,t.jsxs)(n.semantics,{children:[(0,t.jsx)(n.mrow,{children:(0,t.jsxs)(n.msub,{children:[(0,t.jsx)(n.mi,{children:`o`}),(0,t.jsx)(n.mi,{children:`j`})]})}),(0,t.jsx)(n.annotation,{encoding:`application/x-tex`,children:`o_j`})]})})}),(0,t.jsx)(n.span,{className:`katex-html`,"aria-hidden":`true`,children:(0,t.jsxs)(n.span,{className:`base`,children:[(0,t.jsx)(n.span,{className:`strut`,style:{height:`0.7167em`,verticalAlign:`-0.2861em`}}),(0,t.jsxs)(n.span,{className:`mord`,children:[(0,t.jsx)(n.span,{className:`mord mathnormal`,children:`o`}),(0,t.jsx)(n.span,{className:`msupsub`,children:(0,t.jsxs)(n.span,{className:`vlist-t vlist-t2`,children:[(0,t.jsxs)(n.span,{className:`vlist-r`,children:[(0,t.jsx)(n.span,{className:`vlist`,style:{height:`0.3117em`},children:(0,t.jsxs)(n.span,{style:{top:`-2.55em`,marginLeft:`0em`,marginRight:`0.05em`},children:[(0,t.jsx)(n.span,{className:`pstrut`,style:{height:`2.7em`}}),(0,t.jsx)(n.span,{className:`sizing reset-size6 size3 mtight`,children:(0,t.jsx)(n.span,{className:`mord mathnormal mtight`,style:{marginRight:`0.0572em`},children:`j`})})]})}),(0,t.jsx)(n.span,{className:`vlist-s`,children:`​`})]}),(0,t.jsx)(n.span,{className:`vlist-r`,children:(0,t.jsx)(n.span,{className:`vlist`,style:{height:`0.2861em`},children:(0,t.jsx)(n.span,{})})})]})})]})]})})]}),` is
an objective and `,(0,t.jsxs)(n.span,{className:`katex`,children:[(0,t.jsx)(n.span,{className:`katex-mathml`,children:(0,t.jsx)(n.math,{xmlns:`http://www.w3.org/1998/Math/MathML`,children:(0,t.jsxs)(n.semantics,{children:[(0,t.jsx)(n.mrow,{children:(0,t.jsx)(n.mi,{children:`a`})}),(0,t.jsx)(n.annotation,{encoding:`application/x-tex`,children:`a`})]})})}),(0,t.jsx)(n.span,{className:`katex-html`,"aria-hidden":`true`,children:(0,t.jsxs)(n.span,{className:`base`,children:[(0,t.jsx)(n.span,{className:`strut`,style:{height:`0.4306em`}}),(0,t.jsx)(n.span,{className:`mord mathnormal`,children:`a`})]})})]}),` is the risk-aggregation mode. Each objective produces a
score block `,(0,t.jsxs)(n.span,{className:`katex`,children:[(0,t.jsx)(n.span,{className:`katex-mathml`,children:(0,t.jsx)(n.math,{xmlns:`http://www.w3.org/1998/Math/MathML`,children:(0,t.jsxs)(n.semantics,{children:[(0,t.jsxs)(n.mrow,{children:[(0,t.jsxs)(n.msub,{children:[(0,t.jsx)(n.mi,{children:`g`}),(0,t.jsxs)(n.mrow,{children:[(0,t.jsxs)(n.msub,{children:[(0,t.jsx)(n.mi,{children:`o`}),(0,t.jsx)(n.mi,{children:`j`})]}),(0,t.jsx)(n.mo,{separator:`true`,children:`,`}),(0,t.jsx)(n.mi,{children:`a`})]})]}),(0,t.jsx)(n.mo,{stretchy:`false`,children:`(`}),(0,t.jsx)(n.mi,{children:`x`}),(0,t.jsx)(n.mo,{stretchy:`false`,children:`)`})]}),(0,t.jsx)(n.annotation,{encoding:`application/x-tex`,children:`g_{o_j,a}(x)`})]})})}),(0,t.jsx)(n.span,{className:`katex-html`,"aria-hidden":`true`,children:(0,t.jsxs)(n.span,{className:`base`,children:[(0,t.jsx)(n.span,{className:`strut`,style:{height:`1.0973em`,verticalAlign:`-0.3473em`}}),(0,t.jsxs)(n.span,{className:`mord`,children:[(0,t.jsx)(n.span,{className:`mord mathnormal`,style:{marginRight:`0.0359em`},children:`g`}),(0,t.jsx)(n.span,{className:`msupsub`,children:(0,t.jsxs)(n.span,{className:`vlist-t vlist-t2`,children:[(0,t.jsxs)(n.span,{className:`vlist-r`,children:[(0,t.jsx)(n.span,{className:`vlist`,style:{height:`0.1514em`},children:(0,t.jsxs)(n.span,{style:{top:`-2.55em`,marginLeft:`-0.0359em`,marginRight:`0.05em`},children:[(0,t.jsx)(n.span,{className:`pstrut`,style:{height:`2.7em`}}),(0,t.jsx)(n.span,{className:`sizing reset-size6 size3 mtight`,children:(0,t.jsxs)(n.span,{className:`mord mtight`,children:[(0,t.jsxs)(n.span,{className:`mord mtight`,children:[(0,t.jsx)(n.span,{className:`mord mathnormal mtight`,children:`o`}),(0,t.jsx)(n.span,{className:`msupsub`,children:(0,t.jsxs)(n.span,{className:`vlist-t vlist-t2`,children:[(0,t.jsxs)(n.span,{className:`vlist-r`,children:[(0,t.jsx)(n.span,{className:`vlist`,style:{height:`0.3281em`},children:(0,t.jsxs)(n.span,{style:{top:`-2.357em`,marginLeft:`0em`,marginRight:`0.0714em`},children:[(0,t.jsx)(n.span,{className:`pstrut`,style:{height:`2.5em`}}),(0,t.jsx)(n.span,{className:`sizing reset-size3 size1 mtight`,children:(0,t.jsx)(n.span,{className:`mord mathnormal mtight`,style:{marginRight:`0.0572em`},children:`j`})})]})}),(0,t.jsx)(n.span,{className:`vlist-s`,children:`​`})]}),(0,t.jsx)(n.span,{className:`vlist-r`,children:(0,t.jsx)(n.span,{className:`vlist`,style:{height:`0.2819em`},children:(0,t.jsx)(n.span,{})})})]})})]}),(0,t.jsx)(n.span,{className:`mpunct mtight`,children:`,`}),(0,t.jsx)(n.span,{className:`mord mathnormal mtight`,children:`a`})]})})]})}),(0,t.jsx)(n.span,{className:`vlist-s`,children:`​`})]}),(0,t.jsx)(n.span,{className:`vlist-r`,children:(0,t.jsx)(n.span,{className:`vlist`,style:{height:`0.3473em`},children:(0,t.jsx)(n.span,{})})})]})})]}),(0,t.jsx)(n.span,{className:`mopen`,children:`(`}),(0,t.jsx)(n.span,{className:`mord mathnormal`,children:`x`}),(0,t.jsx)(n.span,{className:`mclose`,children:`)`})]})})]}),`, and the blocks are concatenated in policy order:`]}),`
`,(0,t.jsx)(n.span,{className:`katex-display`,children:(0,t.jsxs)(n.span,{className:`katex`,children:[(0,t.jsx)(n.span,{className:`katex-mathml`,children:(0,t.jsx)(n.math,{xmlns:`http://www.w3.org/1998/Math/MathML`,display:`block`,children:(0,t.jsxs)(n.semantics,{children:[(0,t.jsxs)(n.mrow,{children:[(0,t.jsxs)(n.msub,{children:[(0,t.jsx)(n.mi,{children:`F`}),(0,t.jsx)(n.mi,{children:`π`})]}),(0,t.jsx)(n.mo,{stretchy:`false`,children:`(`}),(0,t.jsx)(n.mi,{children:`x`}),(0,t.jsx)(n.mo,{stretchy:`false`,children:`)`}),(0,t.jsx)(n.mo,{children:`=`}),(0,t.jsxs)(n.msub,{children:[(0,t.jsx)(n.mi,{children:`g`}),(0,t.jsxs)(n.mrow,{children:[(0,t.jsxs)(n.msub,{children:[(0,t.jsx)(n.mi,{children:`o`}),(0,t.jsx)(n.mn,{children:`1`})]}),(0,t.jsx)(n.mo,{separator:`true`,children:`,`}),(0,t.jsx)(n.mi,{children:`a`})]})]}),(0,t.jsx)(n.mo,{stretchy:`false`,children:`(`}),(0,t.jsx)(n.mi,{children:`x`}),(0,t.jsx)(n.mo,{stretchy:`false`,children:`)`}),(0,t.jsx)(n.mo,{mathvariant:`normal`,lspace:`0.22em`,rspace:`0.22em`,children:`∥`}),(0,t.jsx)(n.mo,{children:`⋯`}),(0,t.jsx)(n.mo,{mathvariant:`normal`,lspace:`0.22em`,rspace:`0.22em`,children:`∥`}),(0,t.jsxs)(n.msub,{children:[(0,t.jsx)(n.mi,{children:`g`}),(0,t.jsxs)(n.mrow,{children:[(0,t.jsxs)(n.msub,{children:[(0,t.jsx)(n.mi,{children:`o`}),(0,t.jsx)(n.mi,{children:`m`})]}),(0,t.jsx)(n.mo,{separator:`true`,children:`,`}),(0,t.jsx)(n.mi,{children:`a`})]})]}),(0,t.jsx)(n.mo,{stretchy:`false`,children:`(`}),(0,t.jsx)(n.mi,{children:`x`}),(0,t.jsx)(n.mo,{stretchy:`false`,children:`)`})]}),(0,t.jsx)(n.annotation,{encoding:`application/x-tex`,children:`F_{\\pi}(x) = g_{o_1,a}(x) \\mathbin{\\Vert} \\cdots \\mathbin{\\Vert} g_{o_m,a}(x)`})]})})}),(0,t.jsxs)(n.span,{className:`katex-html`,"aria-hidden":`true`,children:[(0,t.jsxs)(n.span,{className:`base`,children:[(0,t.jsx)(n.span,{className:`strut`,style:{height:`1em`,verticalAlign:`-0.25em`}}),(0,t.jsxs)(n.span,{className:`mord`,children:[(0,t.jsx)(n.span,{className:`mord mathnormal`,style:{marginRight:`0.1389em`},children:`F`}),(0,t.jsx)(n.span,{className:`msupsub`,children:(0,t.jsxs)(n.span,{className:`vlist-t vlist-t2`,children:[(0,t.jsxs)(n.span,{className:`vlist-r`,children:[(0,t.jsx)(n.span,{className:`vlist`,style:{height:`0.1514em`},children:(0,t.jsxs)(n.span,{style:{top:`-2.55em`,marginLeft:`-0.1389em`,marginRight:`0.05em`},children:[(0,t.jsx)(n.span,{className:`pstrut`,style:{height:`2.7em`}}),(0,t.jsx)(n.span,{className:`sizing reset-size6 size3 mtight`,children:(0,t.jsx)(n.span,{className:`mord mtight`,children:(0,t.jsx)(n.span,{className:`mord mathnormal mtight`,style:{marginRight:`0.0359em`},children:`π`})})})]})}),(0,t.jsx)(n.span,{className:`vlist-s`,children:`​`})]}),(0,t.jsx)(n.span,{className:`vlist-r`,children:(0,t.jsx)(n.span,{className:`vlist`,style:{height:`0.15em`},children:(0,t.jsx)(n.span,{})})})]})})]}),(0,t.jsx)(n.span,{className:`mopen`,children:`(`}),(0,t.jsx)(n.span,{className:`mord mathnormal`,children:`x`}),(0,t.jsx)(n.span,{className:`mclose`,children:`)`}),(0,t.jsx)(n.span,{className:`mspace`,style:{marginRight:`0.2778em`}}),(0,t.jsx)(n.span,{className:`mrel`,children:`=`}),(0,t.jsx)(n.span,{className:`mspace`,style:{marginRight:`0.2778em`}})]}),(0,t.jsxs)(n.span,{className:`base`,children:[(0,t.jsx)(n.span,{className:`strut`,style:{height:`1.0361em`,verticalAlign:`-0.2861em`}}),(0,t.jsxs)(n.span,{className:`mord`,children:[(0,t.jsx)(n.span,{className:`mord mathnormal`,style:{marginRight:`0.0359em`},children:`g`}),(0,t.jsx)(n.span,{className:`msupsub`,children:(0,t.jsxs)(n.span,{className:`vlist-t vlist-t2`,children:[(0,t.jsxs)(n.span,{className:`vlist-r`,children:[(0,t.jsx)(n.span,{className:`vlist`,style:{height:`0.1514em`},children:(0,t.jsxs)(n.span,{style:{top:`-2.55em`,marginLeft:`-0.0359em`,marginRight:`0.05em`},children:[(0,t.jsx)(n.span,{className:`pstrut`,style:{height:`2.7em`}}),(0,t.jsx)(n.span,{className:`sizing reset-size6 size3 mtight`,children:(0,t.jsxs)(n.span,{className:`mord mtight`,children:[(0,t.jsxs)(n.span,{className:`mord mtight`,children:[(0,t.jsx)(n.span,{className:`mord mathnormal mtight`,children:`o`}),(0,t.jsx)(n.span,{className:`msupsub`,children:(0,t.jsxs)(n.span,{className:`vlist-t vlist-t2`,children:[(0,t.jsxs)(n.span,{className:`vlist-r`,children:[(0,t.jsx)(n.span,{className:`vlist`,style:{height:`0.3173em`},children:(0,t.jsxs)(n.span,{style:{top:`-2.357em`,marginLeft:`0em`,marginRight:`0.0714em`},children:[(0,t.jsx)(n.span,{className:`pstrut`,style:{height:`2.5em`}}),(0,t.jsx)(n.span,{className:`sizing reset-size3 size1 mtight`,children:(0,t.jsx)(n.span,{className:`mord mtight`,children:`1`})})]})}),(0,t.jsx)(n.span,{className:`vlist-s`,children:`​`})]}),(0,t.jsx)(n.span,{className:`vlist-r`,children:(0,t.jsx)(n.span,{className:`vlist`,style:{height:`0.143em`},children:(0,t.jsx)(n.span,{})})})]})})]}),(0,t.jsx)(n.span,{className:`mpunct mtight`,children:`,`}),(0,t.jsx)(n.span,{className:`mord mathnormal mtight`,children:`a`})]})})]})}),(0,t.jsx)(n.span,{className:`vlist-s`,children:`​`})]}),(0,t.jsx)(n.span,{className:`vlist-r`,children:(0,t.jsx)(n.span,{className:`vlist`,style:{height:`0.2861em`},children:(0,t.jsx)(n.span,{})})})]})})]}),(0,t.jsx)(n.span,{className:`mopen`,children:`(`}),(0,t.jsx)(n.span,{className:`mord mathnormal`,children:`x`}),(0,t.jsx)(n.span,{className:`mclose`,children:`)`}),(0,t.jsx)(n.span,{className:`mspace`,style:{marginRight:`0.2222em`}}),(0,t.jsx)(n.span,{className:`mbin`,children:(0,t.jsx)(n.span,{className:`mord`,children:`∥`})}),(0,t.jsx)(n.span,{className:`mspace`,style:{marginRight:`0.2222em`}})]}),(0,t.jsxs)(n.span,{className:`base`,children:[(0,t.jsx)(n.span,{className:`strut`,style:{height:`1em`,verticalAlign:`-0.25em`}}),(0,t.jsx)(n.span,{className:`minner`,children:`⋯`}),(0,t.jsx)(n.span,{className:`mspace`,style:{marginRight:`0.2222em`}}),(0,t.jsx)(n.span,{className:`mbin`,children:(0,t.jsx)(n.span,{className:`mord`,children:`∥`})}),(0,t.jsx)(n.span,{className:`mspace`,style:{marginRight:`0.2222em`}})]}),(0,t.jsxs)(n.span,{className:`base`,children:[(0,t.jsx)(n.span,{className:`strut`,style:{height:`1.0361em`,verticalAlign:`-0.2861em`}}),(0,t.jsxs)(n.span,{className:`mord`,children:[(0,t.jsx)(n.span,{className:`mord mathnormal`,style:{marginRight:`0.0359em`},children:`g`}),(0,t.jsx)(n.span,{className:`msupsub`,children:(0,t.jsxs)(n.span,{className:`vlist-t vlist-t2`,children:[(0,t.jsxs)(n.span,{className:`vlist-r`,children:[(0,t.jsx)(n.span,{className:`vlist`,style:{height:`0.1514em`},children:(0,t.jsxs)(n.span,{style:{top:`-2.55em`,marginLeft:`-0.0359em`,marginRight:`0.05em`},children:[(0,t.jsx)(n.span,{className:`pstrut`,style:{height:`2.7em`}}),(0,t.jsx)(n.span,{className:`sizing reset-size6 size3 mtight`,children:(0,t.jsxs)(n.span,{className:`mord mtight`,children:[(0,t.jsxs)(n.span,{className:`mord mtight`,children:[(0,t.jsx)(n.span,{className:`mord mathnormal mtight`,children:`o`}),(0,t.jsx)(n.span,{className:`msupsub`,children:(0,t.jsxs)(n.span,{className:`vlist-t vlist-t2`,children:[(0,t.jsxs)(n.span,{className:`vlist-r`,children:[(0,t.jsx)(n.span,{className:`vlist`,style:{height:`0.1645em`},children:(0,t.jsxs)(n.span,{style:{top:`-2.357em`,marginLeft:`0em`,marginRight:`0.0714em`},children:[(0,t.jsx)(n.span,{className:`pstrut`,style:{height:`2.5em`}}),(0,t.jsx)(n.span,{className:`sizing reset-size3 size1 mtight`,children:(0,t.jsx)(n.span,{className:`mord mathnormal mtight`,children:`m`})})]})}),(0,t.jsx)(n.span,{className:`vlist-s`,children:`​`})]}),(0,t.jsx)(n.span,{className:`vlist-r`,children:(0,t.jsx)(n.span,{className:`vlist`,style:{height:`0.143em`},children:(0,t.jsx)(n.span,{})})})]})})]}),(0,t.jsx)(n.span,{className:`mpunct mtight`,children:`,`}),(0,t.jsx)(n.span,{className:`mord mathnormal mtight`,children:`a`})]})})]})}),(0,t.jsx)(n.span,{className:`vlist-s`,children:`​`})]}),(0,t.jsx)(n.span,{className:`vlist-r`,children:(0,t.jsx)(n.span,{className:`vlist`,style:{height:`0.2861em`},children:(0,t.jsx)(n.span,{})})})]})})]}),(0,t.jsx)(n.span,{className:`mopen`,children:`(`}),(0,t.jsx)(n.span,{className:`mord mathnormal`,children:`x`}),(0,t.jsx)(n.span,{className:`mclose`,children:`)`})]})]})]})}),`
`,(0,t.jsxs)(n.p,{children:[`The default blocks represent known-exploited vulnerabilities, critical
vulnerabilities, high vulnerabilities, summed EPSS, package exposures,
incompatibilities, changed packages, and oldness. With `,(0,t.jsx)(n.code,{children:`riskAggregation: "both"`}),`,
security blocks contain both unique-advisory and package-exposure values.`]}),`
`,(0,t.jsx)(n.p,{children:`Pastoralist minimizes the vector lexicographically:`}),`
`,(0,t.jsx)(n.span,{className:`katex-display`,children:(0,t.jsxs)(n.span,{className:`katex`,children:[(0,t.jsx)(n.span,{className:`katex-mathml`,children:(0,t.jsx)(n.math,{xmlns:`http://www.w3.org/1998/Math/MathML`,display:`block`,children:(0,t.jsxs)(n.semantics,{children:[(0,t.jsxs)(n.mrow,{children:[(0,t.jsxs)(n.msup,{children:[(0,t.jsx)(n.mi,{children:`x`}),(0,t.jsx)(n.mo,{children:`∗`})]}),(0,t.jsx)(n.mo,{children:`=`}),(0,t.jsxs)(n.munderover,{children:[(0,t.jsxs)(n.mrow,{children:[(0,t.jsx)(n.mi,{mathvariant:`normal`,children:`arg min`}),(0,t.jsx)(n.mo,{children:`⁡`})]}),(0,t.jsxs)(n.mrow,{children:[(0,t.jsx)(n.mi,{children:`x`}),(0,t.jsx)(n.mo,{children:`∈`}),(0,t.jsx)(n.mi,{mathvariant:`script`,children:`X`})]}),(0,t.jsxs)(n.mrow,{children:[(0,t.jsx)(n.mi,{mathvariant:`normal`,children:`l`}),(0,t.jsx)(n.mi,{mathvariant:`normal`,children:`e`}),(0,t.jsx)(n.mi,{mathvariant:`normal`,children:`x`})]})]}),(0,t.jsxs)(n.msub,{children:[(0,t.jsx)(n.mi,{children:`F`}),(0,t.jsx)(n.mi,{children:`π`})]}),(0,t.jsx)(n.mo,{stretchy:`false`,children:`(`}),(0,t.jsx)(n.mi,{children:`x`}),(0,t.jsx)(n.mo,{stretchy:`false`,children:`)`})]}),(0,t.jsx)(n.annotation,{encoding:`application/x-tex`,children:`x^* = \\operatorname*{arg\\,min}^{\\mathrm{lex}}_{x \\in \\mathcal{X}} F_{\\pi}(x)`})]})})}),(0,t.jsxs)(n.span,{className:`katex-html`,"aria-hidden":`true`,children:[(0,t.jsxs)(n.span,{className:`base`,children:[(0,t.jsx)(n.span,{className:`strut`,style:{height:`0.7387em`}}),(0,t.jsxs)(n.span,{className:`mord`,children:[(0,t.jsx)(n.span,{className:`mord mathnormal`,children:`x`}),(0,t.jsx)(n.span,{className:`msupsub`,children:(0,t.jsx)(n.span,{className:`vlist-t`,children:(0,t.jsx)(n.span,{className:`vlist-r`,children:(0,t.jsx)(n.span,{className:`vlist`,style:{height:`0.7387em`},children:(0,t.jsxs)(n.span,{style:{top:`-3.113em`,marginRight:`0.05em`},children:[(0,t.jsx)(n.span,{className:`pstrut`,style:{height:`2.7em`}}),(0,t.jsx)(n.span,{className:`sizing reset-size6 size3 mtight`,children:(0,t.jsx)(n.span,{className:`mbin mtight`,children:`∗`})})]})})})})})]}),(0,t.jsx)(n.span,{className:`mspace`,style:{marginRight:`0.2778em`}}),(0,t.jsx)(n.span,{className:`mrel`,children:`=`}),(0,t.jsx)(n.span,{className:`mspace`,style:{marginRight:`0.2778em`}})]}),(0,t.jsxs)(n.span,{className:`base`,children:[(0,t.jsx)(n.span,{className:`strut`,style:{height:`2.4201em`,verticalAlign:`-0.9661em`}}),(0,t.jsx)(n.span,{className:`mop op-limits`,children:(0,t.jsxs)(n.span,{className:`vlist-t vlist-t2`,children:[(0,t.jsxs)(n.span,{className:`vlist-r`,children:[(0,t.jsxs)(n.span,{className:`vlist`,style:{height:`1.454em`},children:[(0,t.jsxs)(n.span,{style:{top:`-2.1612em`,marginLeft:`0em`},children:[(0,t.jsx)(n.span,{className:`pstrut`,style:{height:`3em`}}),(0,t.jsx)(n.span,{className:`sizing reset-size6 size3 mtight`,children:(0,t.jsxs)(n.span,{className:`mord mtight`,children:[(0,t.jsx)(n.span,{className:`mord mathnormal mtight`,children:`x`}),(0,t.jsx)(n.span,{className:`mrel mtight`,children:`∈`}),(0,t.jsx)(n.span,{className:`mord mathcal mtight`,style:{marginRight:`0.1464em`},children:`X`})]})})]}),(0,t.jsxs)(n.span,{style:{top:`-3em`},children:[(0,t.jsx)(n.span,{className:`pstrut`,style:{height:`3em`}}),(0,t.jsx)(n.span,{children:(0,t.jsxs)(n.span,{className:`mop`,children:[(0,t.jsx)(n.span,{className:`mord mathrm`,style:{marginRight:`0.0139em`},children:`arg`}),(0,t.jsx)(n.span,{className:`mspace`,style:{marginRight:`0.1667em`}}),(0,t.jsx)(n.span,{className:`mord mathrm`,children:`min`})]})})]}),(0,t.jsxs)(n.span,{style:{top:`-3.8679em`,marginLeft:`0em`},children:[(0,t.jsx)(n.span,{className:`pstrut`,style:{height:`3em`}}),(0,t.jsx)(n.span,{className:`sizing reset-size6 size3 mtight`,children:(0,t.jsx)(n.span,{className:`mord mtight`,children:(0,t.jsx)(n.span,{className:`mord mtight`,children:(0,t.jsx)(n.span,{className:`mord mathrm mtight`,children:`lex`})})})})]})]}),(0,t.jsx)(n.span,{className:`vlist-s`,children:`​`})]}),(0,t.jsx)(n.span,{className:`vlist-r`,children:(0,t.jsx)(n.span,{className:`vlist`,style:{height:`0.9661em`},children:(0,t.jsx)(n.span,{})})})]})}),(0,t.jsx)(n.span,{className:`mspace`,style:{marginRight:`0.1667em`}}),(0,t.jsxs)(n.span,{className:`mord`,children:[(0,t.jsx)(n.span,{className:`mord mathnormal`,style:{marginRight:`0.1389em`},children:`F`}),(0,t.jsx)(n.span,{className:`msupsub`,children:(0,t.jsxs)(n.span,{className:`vlist-t vlist-t2`,children:[(0,t.jsxs)(n.span,{className:`vlist-r`,children:[(0,t.jsx)(n.span,{className:`vlist`,style:{height:`0.1514em`},children:(0,t.jsxs)(n.span,{style:{top:`-2.55em`,marginLeft:`-0.1389em`,marginRight:`0.05em`},children:[(0,t.jsx)(n.span,{className:`pstrut`,style:{height:`2.7em`}}),(0,t.jsx)(n.span,{className:`sizing reset-size6 size3 mtight`,children:(0,t.jsx)(n.span,{className:`mord mtight`,children:(0,t.jsx)(n.span,{className:`mord mathnormal mtight`,style:{marginRight:`0.0359em`},children:`π`})})})]})}),(0,t.jsx)(n.span,{className:`vlist-s`,children:`​`})]}),(0,t.jsx)(n.span,{className:`vlist-r`,children:(0,t.jsx)(n.span,{className:`vlist`,style:{height:`0.15em`},children:(0,t.jsx)(n.span,{})})})]})})]}),(0,t.jsx)(n.span,{className:`mopen`,children:`(`}),(0,t.jsx)(n.span,{className:`mord mathnormal`,children:`x`}),(0,t.jsx)(n.span,{className:`mclose`,children:`)`})]})]})]})}),`
`,(0,t.jsxs)(n.p,{children:[`For each selected dependency `,(0,t.jsxs)(n.span,{className:`katex`,children:[(0,t.jsx)(n.span,{className:`katex-mathml`,children:(0,t.jsx)(n.math,{xmlns:`http://www.w3.org/1998/Math/MathML`,children:(0,t.jsxs)(n.semantics,{children:[(0,t.jsx)(n.mrow,{children:(0,t.jsx)(n.mi,{children:`i`})}),(0,t.jsx)(n.annotation,{encoding:`application/x-tex`,children:`i`})]})})}),(0,t.jsx)(n.span,{className:`katex-html`,"aria-hidden":`true`,children:(0,t.jsxs)(n.span,{className:`base`,children:[(0,t.jsx)(n.span,{className:`strut`,style:{height:`0.6595em`}}),(0,t.jsx)(n.span,{className:`mord mathnormal`,children:`i`})]})})]}),`, the ledger reason stores the shared decision
provenance:`]}),`
`,(0,t.jsx)(n.span,{className:`katex-display`,children:(0,t.jsxs)(n.span,{className:`katex`,children:[(0,t.jsx)(n.span,{className:`katex-mathml`,children:(0,t.jsx)(n.math,{xmlns:`http://www.w3.org/1998/Math/MathML`,display:`block`,children:(0,t.jsxs)(n.semantics,{children:[(0,t.jsxs)(n.mrow,{children:[(0,t.jsxs)(n.msub,{children:[(0,t.jsx)(n.mi,{children:`r`}),(0,t.jsx)(n.mi,{children:`i`})]}),(0,t.jsx)(n.mo,{children:`=`}),(0,t.jsxs)(n.mrow,{children:[(0,t.jsx)(n.mo,{fence:`true`,children:`(`}),(0,t.jsxs)(n.mrow,{children:[(0,t.jsx)(n.mi,{mathvariant:`monospace`,children:`d`}),(0,t.jsx)(n.mi,{mathvariant:`monospace`,children:`e`}),(0,t.jsx)(n.mi,{mathvariant:`monospace`,children:`c`}),(0,t.jsx)(n.mi,{mathvariant:`monospace`,children:`i`}),(0,t.jsx)(n.mi,{mathvariant:`monospace`,children:`s`}),(0,t.jsx)(n.mi,{mathvariant:`monospace`,children:`i`}),(0,t.jsx)(n.mi,{mathvariant:`monospace`,children:`o`}),(0,t.jsx)(n.mi,{mathvariant:`monospace`,children:`n`}),(0,t.jsx)(n.mi,{mathvariant:`monospace`,children:`I`}),(0,t.jsx)(n.mi,{mathvariant:`monospace`,children:`d`})]}),(0,t.jsx)(n.mo,{stretchy:`false`,children:`(`}),(0,t.jsxs)(n.msup,{children:[(0,t.jsx)(n.mi,{children:`x`}),(0,t.jsx)(n.mo,{children:`∗`})]}),(0,t.jsx)(n.mo,{stretchy:`false`,children:`)`}),(0,t.jsx)(n.mo,{separator:`true`,children:`,`}),(0,t.jsxs)(n.mrow,{children:[(0,t.jsx)(n.mi,{mathvariant:`monospace`,children:`p`}),(0,t.jsx)(n.mi,{mathvariant:`monospace`,children:`o`}),(0,t.jsx)(n.mi,{mathvariant:`monospace`,children:`l`}),(0,t.jsx)(n.mi,{mathvariant:`monospace`,children:`i`}),(0,t.jsx)(n.mi,{mathvariant:`monospace`,children:`c`}),(0,t.jsx)(n.mi,{mathvariant:`monospace`,children:`y`}),(0,t.jsx)(n.mi,{mathvariant:`monospace`,children:`H`}),(0,t.jsx)(n.mi,{mathvariant:`monospace`,children:`a`}),(0,t.jsx)(n.mi,{mathvariant:`monospace`,children:`s`}),(0,t.jsx)(n.mi,{mathvariant:`monospace`,children:`h`})]}),(0,t.jsx)(n.mo,{stretchy:`false`,children:`(`}),(0,t.jsx)(n.mi,{children:`π`}),(0,t.jsx)(n.mo,{stretchy:`false`,children:`)`}),(0,t.jsx)(n.mo,{separator:`true`,children:`,`}),(0,t.jsxs)(n.mrow,{children:[(0,t.jsx)(n.mi,{mathvariant:`monospace`,children:`s`}),(0,t.jsx)(n.mi,{mathvariant:`monospace`,children:`e`}),(0,t.jsx)(n.mi,{mathvariant:`monospace`,children:`a`}),(0,t.jsx)(n.mi,{mathvariant:`monospace`,children:`r`}),(0,t.jsx)(n.mi,{mathvariant:`monospace`,children:`c`}),(0,t.jsx)(n.mi,{mathvariant:`monospace`,children:`h`})]}),(0,t.jsx)(n.mo,{separator:`true`,children:`,`}),(0,t.jsxs)(n.mrow,{children:[(0,t.jsx)(n.mi,{mathvariant:`monospace`,children:`i`}),(0,t.jsx)(n.mi,{mathvariant:`monospace`,children:`m`}),(0,t.jsx)(n.mi,{mathvariant:`monospace`,children:`p`}),(0,t.jsx)(n.mi,{mathvariant:`monospace`,children:`a`}),(0,t.jsx)(n.mi,{mathvariant:`monospace`,children:`c`}),(0,t.jsx)(n.mi,{mathvariant:`monospace`,children:`t`})]}),(0,t.jsx)(n.mo,{fence:`true`,children:`)`})]})]}),(0,t.jsx)(n.annotation,{encoding:`application/x-tex`,children:`r_i = \\left(\\mathtt{decisionId}(x^*), \\mathtt{policyHash}(\\pi),
\\mathtt{search}, \\mathtt{impact}\\right)`})]})})}),(0,t.jsxs)(n.span,{className:`katex-html`,"aria-hidden":`true`,children:[(0,t.jsxs)(n.span,{className:`base`,children:[(0,t.jsx)(n.span,{className:`strut`,style:{height:`0.5806em`,verticalAlign:`-0.15em`}}),(0,t.jsxs)(n.span,{className:`mord`,children:[(0,t.jsx)(n.span,{className:`mord mathnormal`,style:{marginRight:`0.0278em`},children:`r`}),(0,t.jsx)(n.span,{className:`msupsub`,children:(0,t.jsxs)(n.span,{className:`vlist-t vlist-t2`,children:[(0,t.jsxs)(n.span,{className:`vlist-r`,children:[(0,t.jsx)(n.span,{className:`vlist`,style:{height:`0.3117em`},children:(0,t.jsxs)(n.span,{style:{top:`-2.55em`,marginLeft:`-0.0278em`,marginRight:`0.05em`},children:[(0,t.jsx)(n.span,{className:`pstrut`,style:{height:`2.7em`}}),(0,t.jsx)(n.span,{className:`sizing reset-size6 size3 mtight`,children:(0,t.jsx)(n.span,{className:`mord mathnormal mtight`,children:`i`})})]})}),(0,t.jsx)(n.span,{className:`vlist-s`,children:`​`})]}),(0,t.jsx)(n.span,{className:`vlist-r`,children:(0,t.jsx)(n.span,{className:`vlist`,style:{height:`0.15em`},children:(0,t.jsx)(n.span,{})})})]})})]}),(0,t.jsx)(n.span,{className:`mspace`,style:{marginRight:`0.2778em`}}),(0,t.jsx)(n.span,{className:`mrel`,children:`=`}),(0,t.jsx)(n.span,{className:`mspace`,style:{marginRight:`0.2778em`}})]}),(0,t.jsxs)(n.span,{className:`base`,children:[(0,t.jsx)(n.span,{className:`strut`,style:{height:`1em`,verticalAlign:`-0.25em`}}),(0,t.jsxs)(n.span,{className:`minner`,children:[(0,t.jsx)(n.span,{className:`mopen delimcenter`,style:{top:`0em`},children:`(`}),(0,t.jsx)(n.span,{className:`mord`,children:(0,t.jsx)(n.span,{className:`mord mathtt`,children:`decisionId`})}),(0,t.jsx)(n.span,{className:`mopen`,children:`(`}),(0,t.jsxs)(n.span,{className:`mord`,children:[(0,t.jsx)(n.span,{className:`mord mathnormal`,children:`x`}),(0,t.jsx)(n.span,{className:`msupsub`,children:(0,t.jsx)(n.span,{className:`vlist-t`,children:(0,t.jsx)(n.span,{className:`vlist-r`,children:(0,t.jsx)(n.span,{className:`vlist`,style:{height:`0.7387em`},children:(0,t.jsxs)(n.span,{style:{top:`-3.113em`,marginRight:`0.05em`},children:[(0,t.jsx)(n.span,{className:`pstrut`,style:{height:`2.7em`}}),(0,t.jsx)(n.span,{className:`sizing reset-size6 size3 mtight`,children:(0,t.jsx)(n.span,{className:`mbin mtight`,children:`∗`})})]})})})})})]}),(0,t.jsx)(n.span,{className:`mclose`,children:`)`}),(0,t.jsx)(n.span,{className:`mpunct`,children:`,`}),(0,t.jsx)(n.span,{className:`mspace`,style:{marginRight:`0.1667em`}}),(0,t.jsx)(n.span,{className:`mord`,children:(0,t.jsx)(n.span,{className:`mord mathtt`,children:`policyHash`})}),(0,t.jsx)(n.span,{className:`mopen`,children:`(`}),(0,t.jsx)(n.span,{className:`mord mathnormal`,style:{marginRight:`0.0359em`},children:`π`}),(0,t.jsx)(n.span,{className:`mclose`,children:`)`}),(0,t.jsx)(n.span,{className:`mpunct`,children:`,`}),(0,t.jsx)(n.span,{className:`mspace`,style:{marginRight:`0.1667em`}}),(0,t.jsx)(n.span,{className:`mord`,children:(0,t.jsx)(n.span,{className:`mord mathtt`,children:`search`})}),(0,t.jsx)(n.span,{className:`mpunct`,children:`,`}),(0,t.jsx)(n.span,{className:`mspace`,style:{marginRight:`0.1667em`}}),(0,t.jsx)(n.span,{className:`mord`,children:(0,t.jsx)(n.span,{className:`mord mathtt`,children:`impact`})}),(0,t.jsx)(n.span,{className:`mclose delimcenter`,style:{top:`0em`},children:`)`})]})]})]})]})}),`
`,(0,t.jsxs)(n.p,{children:[`The reason is per dependency, while the decision ID connects every dependency
selected in the same portfolio. CVE identifiers remain in the sibling `,(0,t.jsx)(n.code,{children:`cves`}),`
field rather than being duplicated in `,(0,t.jsxs)(n.span,{className:`katex`,children:[(0,t.jsx)(n.span,{className:`katex-mathml`,children:(0,t.jsx)(n.math,{xmlns:`http://www.w3.org/1998/Math/MathML`,children:(0,t.jsxs)(n.semantics,{children:[(0,t.jsx)(n.mrow,{children:(0,t.jsxs)(n.msub,{children:[(0,t.jsx)(n.mi,{children:`r`}),(0,t.jsx)(n.mi,{children:`i`})]})}),(0,t.jsx)(n.annotation,{encoding:`application/x-tex`,children:`r_i`})]})})}),(0,t.jsx)(n.span,{className:`katex-html`,"aria-hidden":`true`,children:(0,t.jsxs)(n.span,{className:`base`,children:[(0,t.jsx)(n.span,{className:`strut`,style:{height:`0.5806em`,verticalAlign:`-0.15em`}}),(0,t.jsxs)(n.span,{className:`mord`,children:[(0,t.jsx)(n.span,{className:`mord mathnormal`,style:{marginRight:`0.0278em`},children:`r`}),(0,t.jsx)(n.span,{className:`msupsub`,children:(0,t.jsxs)(n.span,{className:`vlist-t vlist-t2`,children:[(0,t.jsxs)(n.span,{className:`vlist-r`,children:[(0,t.jsx)(n.span,{className:`vlist`,style:{height:`0.3117em`},children:(0,t.jsxs)(n.span,{style:{top:`-2.55em`,marginLeft:`-0.0278em`,marginRight:`0.05em`},children:[(0,t.jsx)(n.span,{className:`pstrut`,style:{height:`2.7em`}}),(0,t.jsx)(n.span,{className:`sizing reset-size6 size3 mtight`,children:(0,t.jsx)(n.span,{className:`mord mathnormal mtight`,children:`i`})})]})}),(0,t.jsx)(n.span,{className:`vlist-s`,children:`​`})]}),(0,t.jsx)(n.span,{className:`vlist-r`,children:(0,t.jsx)(n.span,{className:`vlist`,style:{height:`0.15em`},children:(0,t.jsx)(n.span,{})})})]})})]})]})})]}),`.`]}),`
`,(0,t.jsx)(n.h2,{id:`cli-options`,children:`CLI Options`}),`
`,(0,t.jsxs)(n.table,{children:[(0,t.jsx)(n.thead,{children:(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.th,{children:`Option`}),(0,t.jsx)(n.th,{children:`Description`})]})}),(0,t.jsxs)(n.tbody,{children:[(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`--checkSecurity`})}),(0,t.jsx)(n.td,{children:`Enable security vulnerability checking`})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`--forceSecurityRefactor`})}),(0,t.jsx)(n.td,{children:`Automatically apply security fixes without prompting`})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`--securityProvider <provider>`})}),(0,t.jsx)(n.td,{children:`Specify one or more security providers`})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`--securityProviderToken <token>`})}),(0,t.jsx)(n.td,{children:`Provide an authentication token for one-off/local use`})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`--interactive`})}),(0,t.jsx)(n.td,{children:`Use interactive mode to select fixes`})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`--hasWorkspaceSecurityChecks`})}),(0,t.jsx)(n.td,{children:`Include workspace packages in the security scan`})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`--strict`})}),(0,t.jsx)(n.td,{children:`Fail on provider, network, or API errors`})]})]})]}),`
`,(0,t.jsx)(n.h3,{id:`token-handling`,children:`Token Handling`}),`
`,(0,t.jsxs)(n.p,{children:[`Set provider tokens with environment variables whenever possible:
`,(0,t.jsx)(n.code,{children:`GITHUB_TOKEN`}),`, `,(0,t.jsx)(n.code,{children:`SNYK_TOKEN`}),`, `,(0,t.jsx)(n.code,{children:`SOCKET_SECURITY_API_KEY`}),`, or `,(0,t.jsx)(n.code,{children:`SPEKTION_API_KEY`}),`.
`,(0,t.jsx)(n.code,{children:`securityProviderToken`}),` remains available for controlled local or generated
config, but do not commit real tokens to the repository.`]}),`
`,(0,t.jsx)(n.h2,{id:`release-assurance`,children:`Release Assurance`}),`
`,(0,t.jsx)(n.p,{children:`Pastoralist npm releases are published from GitHub Actions with npm provenance.
The release workflow also packs the npm tarball before publishing and creates a
GitHub artifact attestation for that exact tarball.`}),`
`,(0,t.jsx)(n.p,{children:`You can inspect provenance on the npm package page and verify registry
signatures from your own project:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`npm audit signatures
`})}),`
`,(0,t.jsx)(n.p,{children:`These checks prove where the package was built and which artifact was published.
They do not prove the code is bug-free, so the project also runs CI, CodeQL,
OpenSSF Scorecard, dependency update policy checks, and unit, integration, and
e2e tests.`}),`
`,(0,t.jsx)(n.h2,{id:`security-providers`,children:`Security Providers`}),`
`,(0,t.jsx)(n.h3,{id:`osv-open-source-vulnerabilities`,children:`OSV (Open Source Vulnerabilities)`}),`
`,(0,t.jsx)(n.p,{children:`Free and requires no token.`}),`
`,(0,t.jsxs)(n.p,{children:[`The `,(0,t.jsx)(n.a,{href:`https://osv.dev/`,children:`OSV database`}),` is a distributed vulnerability database for open source, created by Google and the open source community.`]}),`
`,(0,t.jsx)(n.h3,{id:`github-provider`,children:`GitHub Provider`}),`
`,(0,t.jsx)(n.p,{children:`Requires a token but provides more in-depth security awareness, including transitive dependencies.`}),`
`,(0,t.jsx)(n.p,{children:`The GitHub provider uses Dependabot alerts to check for vulnerabilities. This provider queries GitHub's Dependabot API for your repository.`}),`
`,(0,t.jsx)(n.h4,{id:`setup`,children:`Setup`}),`
`,(0,t.jsx)(n.p,{children:`The GitHub provider supports two authentication methods:`}),`
`,(0,t.jsx)(n.p,{children:(0,t.jsx)(n.strong,{children:`Option 1: GitHub CLI (Recommended)`})}),`
`,(0,t.jsxs)(n.p,{children:[`If you have the `,(0,t.jsx)(n.a,{href:`https://cli.github.com/`,children:`GitHub CLI`}),` installed and authenticated, no additional setup is required:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`# Install and authenticate gh CLI
gh auth login

# Run pastoralist with GitHub provider
pastoralist --checkSecurity --securityProvider github
`})}),`
`,(0,t.jsx)(n.p,{children:(0,t.jsx)(n.strong,{children:`Option 2: Personal Access Token`})}),`
`,(0,t.jsx)(n.p,{children:`If you don't have the GitHub CLI, you can provide a GitHub token:`}),`
`,(0,t.jsxs)(n.ol,{children:[`
`,(0,t.jsxs)(n.li,{children:[`Create a personal access token at `,(0,t.jsx)(n.a,{href:`https://github.com/settings/tokens`,children:`https://github.com/settings/tokens`}),` with `,(0,t.jsx)(n.code,{children:`repo`}),` scope`]}),`
`,(0,t.jsxs)(n.li,{children:[`Set the token as an environment variable:`,`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`export GITHUB_TOKEN=your_token_here
`})}),`
`]}),`
`,(0,t.jsxs)(n.li,{children:[`Or pass it via CLI in one-off/local use:`,`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`pastoralist --checkSecurity --securityProvider github --securityProviderToken your_token_here
`})}),`
`]}),`
`]}),`
`,(0,t.jsx)(n.h4,{id:`cicd-permissions`,children:`CI/CD Permissions`}),`
`,(0,t.jsx)(n.p,{children:`When using the GitHub provider in CI workflows, you need to:`}),`
`,(0,t.jsxs)(n.ol,{children:[`
`,(0,t.jsx)(n.li,{children:(0,t.jsx)(n.strong,{children:`Add workflow permissions:`})}),`
`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-yaml`,children:`permissions:
  contents: read
  vulnerability-alerts: read
`})}),`
`,(0,t.jsxs)(n.ol,{start:`2`,children:[`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`Enable Dependabot alerts`}),` in your repository: Settings → Code security and analysis → Dependabot alerts`]}),`
`]}),`
`,(0,t.jsx)(n.p,{children:`If permissions are insufficient, Pastoralist will display a warning with guidance and continue (your workflow won't fail).`}),`
`,(0,t.jsx)(n.h3,{id:`npm-audit-provider`,children:`npm Audit Provider`}),`
`,(0,t.jsx)(n.p,{children:`Runs the current package manager's audit command and converts the result into
Pastoralist security alerts.`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`pastoralist --checkSecurity --securityProvider npm
`})}),`
`,(0,t.jsx)(n.p,{children:`This provider uses the package manager detected for the project: npm, Yarn,
pnpm, or Bun.`}),`
`,(0,t.jsx)(n.h3,{id:`snyk-provider-experimental`,children:`Snyk Provider [EXPERIMENTAL]`}),`
`,(0,t.jsxs)(n.p,{children:[`:::caution[Experimental]
The Snyk provider is experimental and may have breaking changes. Report issues at `,(0,t.jsx)(n.a,{href:`https://github.com/yowainwright/pastoralist/issues`,children:`https://github.com/yowainwright/pastoralist/issues`}),`
:::`]}),`
`,(0,t.jsx)(n.p,{children:`Requires the Snyk CLI and API authentication token.`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`# Set your Snyk token
export SNYK_TOKEN=your_token_here

# Run with Snyk provider
pastoralist --checkSecurity --securityProvider snyk
`})}),`
`,(0,t.jsx)(n.h3,{id:`socket-provider-experimental`,children:`Socket Provider [EXPERIMENTAL]`}),`
`,(0,t.jsxs)(n.p,{children:[`:::caution[Experimental]
The Socket provider is experimental and may have breaking changes. Report issues at `,(0,t.jsx)(n.a,{href:`https://github.com/yowainwright/pastoralist/issues`,children:`https://github.com/yowainwright/pastoralist/issues`}),`
:::`]}),`
`,(0,t.jsx)(n.p,{children:`Requires the Socket CLI and API key.`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`# Set your Socket API key
export SOCKET_SECURITY_API_KEY=your_key_here

# Run with Socket provider
pastoralist --checkSecurity --securityProvider socket
`})}),`
`,(0,t.jsx)(n.h3,{id:`spektion-provider-experimental`,children:`Spektion Provider [EXPERIMENTAL]`}),`
`,(0,t.jsxs)(n.p,{children:[`:::caution[Experimental]
The Spektion provider is experimental and may have breaking changes. Report issues at `,(0,t.jsx)(n.a,{href:`https://github.com/yowainwright/pastoralist/issues`,children:`https://github.com/yowainwright/pastoralist/issues`}),`
:::`]}),`
`,(0,t.jsx)(n.p,{children:`Requires a Spektion API key.`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`# Set your Spektion API key
export SPEKTION_API_KEY=your_key_here

# Run with Spektion provider
pastoralist --checkSecurity --securityProvider spektion
`})}),`
`,(0,t.jsx)(n.h2,{id:`cve-tracking-in-the-ledger`,children:`CVE Tracking in the Ledger`}),`
`,(0,t.jsxs)(n.p,{children:[`Every appendix entry has a `,(0,t.jsx)(n.code,{children:`ledger`}),`. When a security provider detects a fix,
Pastoralist adds CVE, severity, provider, and vulnerable-range metadata to that
ledger alongside the `,(0,t.jsx)(n.code,{children:`addedDate`}),`:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-json`,children:`{
  "lodash@4.17.21": {
    "dependents": { "my-app": "lodash@^4.17.0" },
    "ledger": {
      "addedDate": "2026-05-30T00:00:00.000Z",
      "source": "security",
      "securityChecked": true,
      "securityProvider": "osv",
      "cves": ["CVE-2021-23337"],
      "cveDetails": [
        {
          "cve": "CVE-2021-23337",
          "severity": "high",
          "patchedVersion": "4.17.21"
        }
      ],
      "severity": "high",
      "vulnerableRange": "<4.17.21",
      "patchedVersion": "4.17.21"
    }
  }
}
`})}),`
`,(0,t.jsxs)(n.p,{children:[`Multiple CVEs from the same package are aggregated — `,(0,t.jsx)(n.code,{children:`cveDetails`}),` gives per-CVE granularity (severity and patched version per identifier), while `,(0,t.jsx)(n.code,{children:`cves`}),` is the deduplicated flat list for quick reference.`]}),`
`,(0,t.jsxs)(n.p,{children:[(0,t.jsx)(n.code,{children:`reason`}),` accepts a non-empty string or a typed `,(0,t.jsx)(n.code,{children:`project`}),` or `,(0,t.jsx)(n.code,{children:`best-case`}),` object.
A best-case reason links each dependency entry to the shared portfolio decision;
the fixed CVEs remain in the sibling `,(0,t.jsx)(n.code,{children:`cves`}),` field.`]}),`
`,(0,t.jsxs)(n.h2,{id:`keeping-security-overrides-with-keep`,children:[`Keeping Security Overrides with `,(0,t.jsx)(n.code,{children:`keep`})]}),`
`,(0,t.jsxs)(n.p,{children:[`By default, `,(0,t.jsx)(n.code,{children:`--remove-unused`}),` will remove overrides whose dependents no longer require them. For security overrides you want to retain regardless, set `,(0,t.jsx)(n.code,{children:`keep`}),` on the ledger:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-json`,children:`{
  "ledger": {
    "addedDate": "2026-05-30T00:00:00.000Z",
    "cves": ["CVE-2024-12345"],
    "keep": true
  }
}
`})}),`
`,(0,t.jsxs)(n.p,{children:[`For expiring keeps, use a `,(0,t.jsx)(n.code,{children:`KeepConstraint`}),` object:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-json`,children:`{
  "ledger": {
    "addedDate": "2026-05-30T00:00:00.000Z",
    "cves": ["CVE-2024-12345"],
    "keep": {
      "reason": "Waiting for upstream patch",
      "untilVersion": "4.18.0"
    }
  }
}
`})}),`
`,(0,t.jsxs)(n.p,{children:[`Once the root dependency reaches `,(0,t.jsx)(n.code,{children:`4.18.0`}),`, the keep is considered expired and `,(0,t.jsx)(n.code,{children:`--remove-unused`}),` will treat it as removable again.`]}),`
`,(0,t.jsx)(n.h2,{id:`how-it-works`,children:`How It Works`}),`
`,(0,t.jsxs)(n.ol,{children:[`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`Scanning`}),`: Pastoralist extracts all dependencies from your `,(0,t.jsx)(n.code,{children:`package.json`}),` (and optionally workspace packages)`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`Checking`}),`: Dependencies are checked against the configured provider or providers`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`Reporting`}),`: Vulnerable packages are displayed with severity levels and available fixes`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`Fixing`}),`: If fixes are available, Pastoralist can:`,`
`,(0,t.jsxs)(n.ul,{children:[`
`,(0,t.jsx)(n.li,{children:`Display them for review`}),`
`,(0,t.jsxs)(n.li,{children:[`Apply them automatically (with `,(0,t.jsx)(n.code,{children:`--forceSecurityRefactor`}),`)`]}),`
`,(0,t.jsxs)(n.li,{children:[`Let you choose interactively (with `,(0,t.jsx)(n.code,{children:`--interactive`}),`)`]}),`
`]}),`
`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`Applying`}),`: Selected fixes are added to your `,(0,t.jsx)(n.code,{children:`package.json`}),` overrides section with full CVE context in the ledger`]}),`
`]}),`
`,(0,t.jsx)(n.h2,{id:`example-output`,children:`Example Output`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-text`,children:`pastoralist checking for security vulnerabilities...

Security Check Report
==================================================

Found 3 vulnerable package(s):

lodash@4.17.20
   Prototype Pollution
   CVE: CVE-2021-23337
   Fix available: 4.17.21
   https://osv.dev/vulnerability/GHSA-35jh-r3h4-6jhm

minimist@1.2.5
   Prototype Pollution
   CVE: CVE-2021-44906
   Fix available: 1.2.6
   https://osv.dev/vulnerability/GHSA-xvch-5gv4-984h

Generated 2 override(s):

  "lodash": "4.17.21" // Security fix: Prototype Pollution (high)
  "minimist": "1.2.6" // Security fix: Prototype Pollution (medium)
`})}),`
`,(0,t.jsx)(n.h2,{id:`performance-considerations`,children:`Performance Considerations`}),`
`,(0,t.jsx)(n.p,{children:`:::caution[Performance Impact]`}),`
`,(0,t.jsxs)(n.ul,{children:[`
`,(0,t.jsxs)(n.li,{children:[`Security scanning is `,(0,t.jsx)(n.strong,{children:`disabled by default`}),` to maintain fast performance`]}),`
`,(0,t.jsxs)(n.li,{children:[`Workspace scanning is `,(0,t.jsx)(n.strong,{children:`opt-in`}),` via the `,(0,t.jsx)(n.code,{children:`hasWorkspaceSecurityChecks`}),` option`]}),`
`,(0,t.jsx)(n.li,{children:`The OSV provider is optimized for batch queries`}),`
`,(0,t.jsx)(n.li,{children:`Provider results can be cached using the CLI cache options`}),`
`,(0,t.jsx)(n.li,{children:`Results are processed in parallel when possible`}),`
`,(0,t.jsx)(n.li,{children:`Best-case results record duration and evaluated-state count
:::`}),`
`]}),`
`,(0,t.jsx)(n.h2,{id:`limitations`,children:`Limitations`}),`
`,(0,t.jsx)(n.p,{children:`:::note[Current Limitations]`}),`
`,(0,t.jsxs)(n.ul,{children:[`
`,(0,t.jsx)(n.li,{children:`Security checks focus on npm ecosystem packages`}),`
`,(0,t.jsx)(n.li,{children:`Some providers require credentials or local CLI access`}),`
`,(0,t.jsx)(n.li,{children:`Some vulnerabilities may not have available fixes
:::`}),`
`]}),`
`,(0,t.jsx)(n.h2,{id:`troubleshooting`,children:`Troubleshooting`}),`
`,(0,t.jsx)(n.h3,{id:`no-vulnerabilities-found-when-expected`,children:`No vulnerabilities found when expected`}),`
`,(0,t.jsxs)(n.ul,{children:[`
`,(0,t.jsx)(n.li,{children:`Ensure you're using the latest version of pastoralist`}),`
`,(0,t.jsx)(n.li,{children:`Check that your dependencies are correctly specified in package.json`}),`
`,(0,t.jsxs)(n.li,{children:[`Try running with `,(0,t.jsx)(n.code,{children:`--debug`}),` to see detailed logs`]}),`
`]}),`
`,(0,t.jsx)(n.h3,{id:`fixes-not-being-applied`,children:`Fixes not being applied`}),`
`,(0,t.jsxs)(n.ul,{children:[`
`,(0,t.jsx)(n.li,{children:`Verify you have write permissions to package.json`}),`
`,(0,t.jsx)(n.li,{children:`Check for existing overrides that might conflict`}),`
`,(0,t.jsx)(n.li,{children:`Ensure the package manager supports overrides`}),`
`]}),`
`,(0,t.jsx)(n.h3,{id:`performance-issues`,children:`Performance issues`}),`
`,(0,t.jsxs)(n.ul,{children:[`
`,(0,t.jsx)(n.li,{children:`Disable workspace scanning if not needed`}),`
`,(0,t.jsxs)(n.li,{children:[`Consider excluding large dependency trees with `,(0,t.jsx)(n.code,{children:`excludePackages`})]}),`
`,(0,t.jsx)(n.li,{children:`Use severity threshold to limit results`}),`
`]}),`
`,(0,t.jsx)(n.h3,{id:`github-provider-shows-security-check-skipped`,children:`GitHub provider shows "security check skipped"`}),`
`,(0,t.jsx)(n.p,{children:`This happens when the GitHub API can't access Dependabot alerts. To fix:`}),`
`,(0,t.jsxs)(n.ol,{children:[`
`,(0,t.jsxs)(n.li,{children:[`Add `,(0,t.jsx)(n.code,{children:`vulnerability-alerts: read`}),` permission to your workflow`]}),`
`,(0,t.jsx)(n.li,{children:`Enable Dependabot alerts in Settings → Code security and analysis`}),`
`,(0,t.jsxs)(n.li,{children:[`Ensure the `,(0,t.jsx)(n.code,{children:`GITHUB_TOKEN`}),` is available in your workflow`]}),`
`]}),`
`,(0,t.jsx)(n.p,{children:`Pastoralist will show specific guidance in the warning message.`}),`
`,(0,t.jsx)(n.h2,{id:`example-cicd-integration`,children:`Example: CI/CD Integration`}),`
`,(0,t.jsx)(n.h3,{id:`github-actions`,children:`GitHub Actions`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-yaml`,children:`name: Security Check
on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      vulnerability-alerts: read # Required for GitHub provider
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v6.4.0
      - run: npm install
      - run: npx pastoralist --checkSecurity --securityProvider github
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
`})}),`
`,(0,t.jsx)(n.p,{children:`For OSV provider (no permissions needed):`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-yaml`,children:`name: Security Check
on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v6.4.0
      - run: npm install
      - run: npx pastoralist --checkSecurity
`})}),`
`,(0,t.jsx)(n.h3,{id:`gitlab-ci`,children:`GitLab CI`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-yaml`,children:`security:
  script:
    - npm install
    - npx pastoralist --checkSecurity
  only:
    - main
    - merge_requests
`})})]})}function r(e={}){let{wrapper:r}=e.components||{};return r?(0,t.jsx)(r,{...e,children:(0,t.jsx)(n,{...e})}):n(e)}export{r as default};