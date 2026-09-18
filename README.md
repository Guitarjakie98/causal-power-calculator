# Causal Power Calculator

An interactive, browser-based power analysis tool for planning **two-group randomized experiments with binary outcomes**.

The calculator is designed to make experiment tradeoffs visible rather than returning only a single sample-size number. Adjust the baseline rate, minimum detectable effect (MDE), statistical power, significance level, treatment allocation, available sample, and expected attrition to see how the design changes.

## Current features

- Binary outcome power analysis for a two-group randomized experiment
- Relative-lift or absolute-percentage-point MDE
- Unequal treatment/control allocation
- Two-sided significance level
- Required analyzable sample size
- Attrition-adjusted recruitment target
- Achieved power for an available sample
- Interactive power curve
- Plain-language feasibility summary
- No backend or data collection

## Statistical approach

For total analyzable sample size (N), treatment allocation (q), control rate (p_0), and treatment rate (p_1):

[
n_t = Nq,qquad n_c=N(1-q)
]

The standard error under the alternative is approximated as:

[
SE = sqrt{rac{p_0(1-p_0)}{n_c}+rac{p_1(1-p_1)}{n_t}}
]

The standardized effect is:

[
lambda = rac{|p_1-p_0|}{SE}
]

For a two-sided test with critical value (z_{1-alpha/2}), approximate power is:

[
P(Z>z_{1-alpha/2}-lambda)+P(Z<-z_{1-alpha/2}-lambda)
]

The app searches for the smallest integer total (N) that reaches the requested target power. Expected attrition is then used to inflate the recruitment target:

[
N_{start}=leftlceilrac{N}{1-a}ightceil
]

where (a) is the expected attrition proportion.

## Important assumptions

This MVP assumes:

- independent experimental units
- randomized assignment
- a binary outcome
- two treatment arms
- a two-sided hypothesis test
- large enough samples for a normal approximation
- no clustering or repeated measurements

It is **not** currently appropriate for clustered randomized trials, geo experiments, switchback experiments, matched-pair designs, repeated measures, or interference between units.

## Run locally

No build step is required.

Open `index.html` directly in a browser, or serve the folder with any static web server.

To run the unit tests:

```bash
npm test
```

The test suite uses Node's built-in test runner and has no third-party dependencies.

## Roadmap

Planned additions:

1. Continuous outcomes
2. Cluster-randomized designs and design effects
3. Geo experiments
4. Switchback experiments with autocorrelation assumptions
5. One-sided tests
6. Confidence-interval / precision planning
7. Simulation-based power
8. Sensitivity tables across MDE and baseline assumptions

## Disclaimer

Power analysis is only as good as its assumptions. This tool is intended for experiment planning and education, not as a substitute for design review when outcomes are clustered, dependent, rare, or otherwise outside the model assumptions.
