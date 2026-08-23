use seed_search_cli::{
    CompiledGogmaCounterSearch, CompiledGogmaSearch, CompiledSkillSearch, GogmaCounterRange,
    GogmaCounterSearchCriteria, GogmaSearchCriteria, SeedRange, SkillSearchCriteria,
    default_thread_count,
};
use std::env;
use std::error::Error;
use std::process::ExitCode;
use std::time::Instant;

const DEFAULT_END_SEED: u32 = 99_999_999;

fn main() -> ExitCode {
    match run() {
        Ok(()) => ExitCode::SUCCESS,
        Err(error) => {
            eprintln!("error: {error}");
            eprintln!("\nRun with --help for usage.");
            ExitCode::FAILURE
        }
    }
}

fn run() -> Result<(), Box<dyn Error>> {
    let arguments: Vec<String> = env::args().skip(1).collect();
    if arguments.is_empty()
        || arguments
            .iter()
            .any(|value| value == "--help" || value == "-h")
    {
        print_help();
        return Ok(());
    }

    match arguments[0].as_str() {
        "gogma" => run_gogma(GogmaCliConfig::parse(&arguments[1..])?),
        "skill" => run_skill(SkillCliConfig::parse(&arguments[1..])?),
        _ => run_skill(SkillCliConfig::parse(&arguments)?),
    }
}

fn run_skill(config: SkillCliConfig) -> Result<(), Box<dyn Error>> {
    let compiled = CompiledSkillSearch::new(config.criteria)?;
    println!(
        "Searching {} seeds ({}..={}) with {} thread(s)...",
        config.range.len(),
        config.range.start,
        config.range.end,
        config.threads
    );
    println!(
        "stream=skill, weaponType={}, attributeForce={}, skillCounter={}, counterGate={}, observations={:?}",
        compiled.criteria().weapon_type,
        compiled.criteria().attribute_force,
        compiled.criteria().skill_counter,
        compiled.criteria().counter_gate,
        compiled.criteria().observations
    );

    report_search(|| compiled.search(config.range, config.threads), "skill")
}

fn run_gogma(config: GogmaCliConfig) -> Result<(), Box<dyn Error>> {
    match config.criteria {
        GogmaCliCriteria::Exact(criteria) => {
            let compiled = CompiledGogmaSearch::new(criteria)?;
            println!(
                "Searching {} seeds ({}..={}) with {} thread(s)...",
                config.range.len(),
                config.range.start,
                config.range.end,
                config.threads
            );
            println!(
                "stream=gogma, weaponType={}, attributeForce={}, gogmaCounter={}, counterGate={}, observations={:?}",
                compiled.criteria().weapon_type,
                compiled.criteria().attribute_force,
                compiled.criteria().gogma_counter,
                compiled.criteria().counter_gate,
                compiled.criteria().observations
            );

            report_search(|| compiled.search(config.range, config.threads), "Gogma")
        }
        GogmaCliCriteria::CounterRange(criteria) => {
            let compiled = CompiledGogmaCounterSearch::new(criteria)?;
            let counter_range = compiled.criteria().counter_range;
            println!(
                "Searching {} seeds ({}..={}) across {} Gogma counters ({}..={}) with {} thread(s)...",
                config.range.len(),
                config.range.start,
                config.range.end,
                counter_range.len(),
                counter_range.start,
                counter_range.end,
                config.threads
            );
            println!(
                "stream=gogma-counter-range, weaponType={}, attributeForce={}, counterGate={}, observations={:?}",
                compiled.criteria().weapon_type,
                compiled.criteria().attribute_force,
                compiled.criteria().counter_gate,
                compiled.criteria().observations
            );

            let started = Instant::now();
            let candidates = compiled.search(config.range, config.threads)?;
            let elapsed = started.elapsed();
            println!(
                "Found {} Gogma seed/counter candidate(s) in {:.3}s:",
                candidates.len(),
                elapsed.as_secs_f64()
            );
            for candidate in candidates {
                println!(
                    "seed={}, gogmaCounter={}",
                    candidate.base_seed, candidate.gogma_counter
                );
            }
            Ok(())
        }
    }
}

fn report_search(
    search: impl FnOnce() -> Result<Vec<u32>, seed_search_cli::SearchError>,
    label: &str,
) -> Result<(), Box<dyn Error>> {
    let started = Instant::now();
    let candidates = search()?;
    let elapsed = started.elapsed();

    println!(
        "Found {} {label} candidate(s) in {:.3}s:",
        candidates.len(),
        elapsed.as_secs_f64()
    );
    for candidate in candidates {
        println!("{candidate}");
    }

    Ok(())
}

struct SkillCliConfig {
    criteria: SkillSearchCriteria,
    range: SeedRange,
    threads: usize,
}

impl SkillCliConfig {
    fn parse(arguments: &[String]) -> Result<Self, String> {
        if arguments.len() == 1 && arguments[0] == "--golden-sample" {
            return Ok(Self::golden_sample());
        }
        if arguments.iter().any(|value| value == "--golden-sample") {
            return Err("--golden-sample cannot be combined with other options".to_owned());
        }

        let mut weapon_type = None;
        let mut attribute_force = None;
        let mut skill_counter = None;
        let mut counter_gate = None;
        let mut observations = None;
        let mut start_seed = 0;
        let mut end_seed = DEFAULT_END_SEED;
        let mut threads = default_thread_count();

        let mut index = 0;
        while index < arguments.len() {
            let option = arguments[index].as_str();
            index += 1;
            let value = arguments
                .get(index)
                .ok_or_else(|| format!("missing value for {option}"))?;
            index += 1;

            match option {
                "--weapon-type" => weapon_type = Some(parse_number(option, value)?),
                "--attribute-force" => attribute_force = Some(parse_number(option, value)?),
                "--skill-counter" => skill_counter = Some(parse_number(option, value)?),
                "--counter-gate" => counter_gate = Some(parse_number(option, value)?),
                "--observations" => observations = Some(parse_skill_observations(value)?),
                "--start-seed" => start_seed = parse_number(option, value)?,
                "--end-seed" => end_seed = parse_number(option, value)?,
                "--threads" => threads = parse_number(option, value)?,
                _ => return Err(format!("unknown skill option: {option}")),
            }
        }

        Ok(Self {
            criteria: SkillSearchCriteria {
                weapon_type: required("--weapon-type", weapon_type)?,
                attribute_force: required("--attribute-force", attribute_force)?,
                skill_counter: required("--skill-counter", skill_counter)?,
                counter_gate: required("--counter-gate", counter_gate)?,
                observations: required("--observations", observations)?,
            },
            range: SeedRange {
                start: start_seed,
                end: end_seed,
            },
            threads,
        })
    }

    fn golden_sample() -> Self {
        Self {
            criteria: SkillSearchCriteria {
                weapon_type: 10,
                attribute_force: 4,
                skill_counter: 186,
                counter_gate: 200,
                observations: vec![275, 255, 245, 243],
            },
            range: SeedRange {
                start: 0,
                end: DEFAULT_END_SEED,
            },
            threads: default_thread_count(),
        }
    }
}

struct GogmaCliConfig {
    criteria: GogmaCliCriteria,
    range: SeedRange,
    threads: usize,
}

enum GogmaCliCriteria {
    Exact(GogmaSearchCriteria),
    CounterRange(GogmaCounterSearchCriteria),
}

impl GogmaCliConfig {
    fn parse(arguments: &[String]) -> Result<Self, String> {
        if arguments.len() == 1 && arguments[0] == "--golden-sample" {
            return Ok(Self::golden_sample());
        }
        if arguments.len() == 1 && arguments[0] == "--golden-counter-range" {
            return Ok(Self::golden_counter_range());
        }
        if arguments
            .iter()
            .any(|value| value == "--golden-sample" || value == "--golden-counter-range")
        {
            return Err("golden sample options cannot be combined with other options".to_owned());
        }

        let mut weapon_type = None;
        let mut attribute_force = None;
        let mut gogma_counter = None;
        let mut gogma_counter_start = None;
        let mut gogma_counter_end = None;
        let mut counter_gate = None;
        let mut observations = None;
        let mut start_seed = 0;
        let mut end_seed = DEFAULT_END_SEED;
        let mut threads = default_thread_count();

        let mut index = 0;
        while index < arguments.len() {
            let option = arguments[index].as_str();
            index += 1;
            let value = arguments
                .get(index)
                .ok_or_else(|| format!("missing value for {option}"))?;
            index += 1;

            match option {
                "--weapon-type" => weapon_type = Some(parse_number(option, value)?),
                "--attribute-force" => attribute_force = Some(parse_number(option, value)?),
                "--gogma-counter" => gogma_counter = Some(parse_number(option, value)?),
                "--gogma-counter-start" => gogma_counter_start = Some(parse_number(option, value)?),
                "--gogma-counter-end" => gogma_counter_end = Some(parse_number(option, value)?),
                "--counter-gate" => counter_gate = Some(parse_number(option, value)?),
                "--observations" => observations = Some(parse_gogma_observations(value)?),
                "--start-seed" => start_seed = parse_number(option, value)?,
                "--end-seed" => end_seed = parse_number(option, value)?,
                "--threads" => threads = parse_number(option, value)?,
                _ => return Err(format!("unknown Gogma option: {option}")),
            }
        }

        let weapon_type = required("--weapon-type", weapon_type)?;
        let attribute_force = required("--attribute-force", attribute_force)?;
        let counter_gate = required("--counter-gate", counter_gate)?;
        let observations = required("--observations", observations)?;
        let criteria = match (gogma_counter, gogma_counter_start, gogma_counter_end) {
            (Some(gogma_counter), None, None) => GogmaCliCriteria::Exact(GogmaSearchCriteria {
                weapon_type,
                attribute_force,
                gogma_counter,
                counter_gate,
                observations,
            }),
            (None, Some(start), Some(end)) => {
                GogmaCliCriteria::CounterRange(GogmaCounterSearchCriteria {
                    weapon_type,
                    attribute_force,
                    counter_gate,
                    counter_range: GogmaCounterRange { start, end },
                    observations,
                })
            }
            (None, None, None) => {
                return Err(
                    "supply --gogma-counter, or both --gogma-counter-start and --gogma-counter-end"
                        .to_owned(),
                );
            }
            _ => {
                return Err(
                    "--gogma-counter cannot be combined with counter start/end; a range requires both endpoints"
                        .to_owned(),
                );
            }
        };

        Ok(Self {
            criteria,
            range: SeedRange {
                start: start_seed,
                end: end_seed,
            },
            threads,
        })
    }

    fn golden_sample() -> Self {
        Self {
            criteria: GogmaCliCriteria::Exact(GogmaSearchCriteria {
                weapon_type: 8,
                attribute_force: 1,
                gogma_counter: 480,
                counter_gate: 200,
                observations: vec![
                    [11, 12, 15, 14, 11],
                    [9, 14, 8, 16, 11],
                    [6, 13, 10, 11, 8],
                    [8, 12, 6, 15, 10],
                    [15, 8, 8, 6, 16],
                    [14, 8, 11, 15, 10],
                ],
            }),
            range: SeedRange {
                start: 0,
                end: DEFAULT_END_SEED,
            },
            threads: default_thread_count(),
        }
    }

    fn golden_counter_range() -> Self {
        Self {
            criteria: GogmaCliCriteria::CounterRange(GogmaCounterSearchCriteria {
                weapon_type: 8,
                attribute_force: 1,
                counter_gate: 200,
                counter_range: GogmaCounterRange {
                    start: 475,
                    end: 485,
                },
                observations: vec![
                    [11, 12, 15, 14, 11],
                    [9, 14, 8, 16, 11],
                    [6, 13, 10, 11, 8],
                    [8, 12, 6, 15, 10],
                    [15, 8, 8, 6, 16],
                    [14, 8, 11, 15, 10],
                ],
            }),
            range: SeedRange {
                start: 0,
                end: DEFAULT_END_SEED,
            },
            threads: default_thread_count(),
        }
    }
}

fn parse_number<T>(option: &str, value: &str) -> Result<T, String>
where
    T: std::str::FromStr,
    T::Err: std::fmt::Display,
{
    value
        .parse()
        .map_err(|error| format!("invalid value for {option}: {value} ({error})"))
}

fn parse_skill_observations(value: &str) -> Result<Vec<u16>, String> {
    if value.is_empty() {
        return Err("--observations must not be empty".to_owned());
    }
    value
        .split(',')
        .map(|item| parse_number("--observations", item.trim()))
        .collect()
}

fn parse_gogma_observations(value: &str) -> Result<Vec<[u8; 5]>, String> {
    if value.is_empty() {
        return Err("--observations must not be empty".to_owned());
    }

    value
        .split(';')
        .enumerate()
        .map(|(roll_index, roll)| {
            let values = roll
                .split(',')
                .map(|item| parse_number("--observations", item.trim()))
                .collect::<Result<Vec<u8>, _>>()?;
            values.try_into().map_err(|values: Vec<u8>| {
                format!(
                    "Gogma observation {} has {} slots; expected exactly 5",
                    roll_index + 1,
                    values.len()
                )
            })
        })
        .collect()
}

fn required<T>(option: &str, value: Option<T>) -> Result<T, String> {
    value.ok_or_else(|| format!("missing required option {option}"))
}

fn print_help() {
    println!(
        "\
Gogma base-seed search

USAGE:
  seed-search-cli skill --weapon-type N --attribute-force N --skill-counter N \\
    --counter-gate N --observations I1,I2,I3,I4 [OPTIONS]

  seed-search-cli gogma --weapon-type N --attribute-force N --gogma-counter N \\
    --counter-gate N --observations \"B1,B2,B3,B4,B5;B1,B2,B3,B4,B5\" [OPTIONS]

  seed-search-cli skill --golden-sample
  seed-search-cli gogma --golden-sample
  seed-search-cli gogma --golden-counter-range

COMMON OPTIONS:
  --weapon-type N       Zero-based weapon type (0..13)
  --attribute-force N   Scrambled attribute-force value used by the RNG
  --counter-gate N      Saved counter gate
  --start-seed N        Inclusive range start (default: 0)
  --end-seed N          Inclusive range end (default: 99999999)
  --threads N           Worker threads (default: available hardware threads)
  -h, --help            Show this help

SKILL OPTIONS:
  --skill-counter N     Saved skill stream counter
  --observations LIST   Consecutive table indices, each in 0..=293

GOGMA OPTIONS:
  --gogma-counter N     Saved Gogma amendment counter
  --gogma-counter-start N  First possible counter when it is unknown
  --gogma-counter-end N    Last possible counter when it is unknown
  --observations LIST   Consecutive five-ID rolls separated by semicolons

The legacy skill syntax without the `skill` subcommand remains supported.
Build and run with --release for full-range searches."
    );
}
