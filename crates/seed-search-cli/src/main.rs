use seed_search_cli::{CompiledSkillSearch, SeedRange, SkillSearchCriteria, default_thread_count};
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
    let Some(config) = CliConfig::parse(env::args().skip(1))? else {
        print_help();
        return Ok(());
    };

    let compiled = CompiledSkillSearch::new(config.criteria)?;
    println!(
        "Searching {} seeds ({}..={}) with {} thread(s)...",
        config.range.len(),
        config.range.start,
        config.range.end,
        config.threads
    );
    println!(
        "weaponType={}, attributeForce={}, skillCounter={}, counterGate={}, observations={:?}",
        compiled.criteria().weapon_type,
        compiled.criteria().attribute_force,
        compiled.criteria().skill_counter,
        compiled.criteria().counter_gate,
        compiled.criteria().observations
    );

    let started = Instant::now();
    let candidates = compiled.search(config.range, config.threads)?;
    let elapsed = started.elapsed();

    println!(
        "Found {} candidate(s) in {:.3}s:",
        candidates.len(),
        elapsed.as_secs_f64()
    );
    for candidate in candidates {
        println!("{candidate}");
    }

    Ok(())
}

struct CliConfig {
    criteria: SkillSearchCriteria,
    range: SeedRange,
    threads: usize,
}

impl CliConfig {
    fn parse(arguments: impl Iterator<Item = String>) -> Result<Option<Self>, String> {
        let arguments: Vec<String> = arguments.collect();
        if arguments.is_empty()
            || arguments
                .iter()
                .any(|value| value == "--help" || value == "-h")
        {
            return Ok(None);
        }
        if arguments.len() == 1 && arguments[0] == "--golden-sample" {
            return Ok(Some(Self::golden_sample()));
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
                "--observations" => observations = Some(parse_observations(value)?),
                "--start-seed" => start_seed = parse_number(option, value)?,
                "--end-seed" => end_seed = parse_number(option, value)?,
                "--threads" => threads = parse_number(option, value)?,
                _ => return Err(format!("unknown option: {option}")),
            }
        }

        Ok(Some(Self {
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
        }))
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

fn parse_number<T>(option: &str, value: &str) -> Result<T, String>
where
    T: std::str::FromStr,
    T::Err: std::fmt::Display,
{
    value
        .parse()
        .map_err(|error| format!("invalid value for {option}: {value} ({error})"))
}

fn parse_observations(value: &str) -> Result<Vec<u16>, String> {
    if value.is_empty() {
        return Err("--observations must not be empty".to_owned());
    }
    value
        .split(',')
        .map(|item| parse_number("--observations", item.trim()))
        .collect()
}

fn required<T>(option: &str, value: Option<T>) -> Result<T, String> {
    value.ok_or_else(|| format!("missing required option {option}"))
}

fn print_help() {
    println!(
        "\
Gogma skill base-seed search

USAGE:
  seed-search-cli --weapon-type N --attribute-force N --skill-counter N \\
    --counter-gate N --observations I1,I2,I3,I4 [OPTIONS]

  seed-search-cli --golden-sample

REQUIRED:
  --weapon-type N       Zero-based weapon type (0..13)
  --attribute-force N   Scrambled attribute-force value used by the skill RNG
  --skill-counter N     Saved skill stream counter
  --counter-gate N      Saved counter gate
  --observations LIST   Consecutive table indices, each in 0..=293

OPTIONS:
  --start-seed N        Inclusive range start (default: 0)
  --end-seed N          Inclusive range end (default: 99999999)
  --threads N           Worker threads (default: available hardware threads)
  --golden-sample       Search the full range for the upstream v0.9.3 sample
  -h, --help            Show this help

Build and run with --release for full-range searches."
    );
}
