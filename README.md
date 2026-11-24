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

No build step or Python packages are required. The app uses JavaScript modules, so opening `index.html` directly from your filesystem will not work reliably.

### One-command setup (Windows PowerShell)

Prerequisites: Git and Python 3.8+ available in your terminal (`git --version` and `python --version`). Paste this single line into PowerShell:

```powershell
$repo = Join-Path $HOME 'causal-power-calculator'; if (!(Test-Path $repo)) { git clone https://github.com/Guitarjakie98/causal-power-calculator.git $repo; if ($LASTEXITCODE -ne 0) { throw 'Clone failed' } }; if (!(Test-Path (Join-Path $repo 'launch.py'))) { throw 'Launcher missing. Update your existing clone with git pull, or choose a different folder.' }; python (Join-Path $repo 'launch.py')
```

This clones the repository if needed, starts a server on an available loopback port, and opens your default browser. Keep the terminal open while using the calculator. Press Ctrl+C to stop it.

### Already downloaded or cloned?

From the project folder, run:

```bash
python launch.py
```

For an older Git clone, run `git pull --ff-only` first to obtain the launcher. On macOS or Linux, use `python3 launch.py` if Python is installed under that name. The launcher prints its local URL if the browser does not open automatically.

Alternatively, use any static web server to serve the repository root over HTTP.

### Unit tests

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
