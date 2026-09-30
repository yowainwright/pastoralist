require "digest"

def local_release_assets(data, version, directory)
  TapRelease.targets(data).to_h do |target|
    filename = TapRelease.asset_name(data, version, target)
    path = File.join(directory, filename)
    present = File.file?(path) && File.size?(path)
    abort "Missing or empty binary: #{filename}" unless present

    url = asset_url(data, version, target)
    checksum = Digest::SHA256.file(path).hexdigest
    [target, { "url" => url, "sha256" => checksum }]
  end
end

def generate_local_formula(tap_path, version, directory, output_path)
  load File.join(tap_path, "scripts", "update-formula")
  data = read_package("pastoralist")
  ensure_managed(data)
  data = TapRelease.release_data(data, version)
  assets = local_release_assets(data, version, directory)
  formula = render_formula(data, version, assets)
  File.write(output_path, formula)
end

if $PROGRAM_NAME == __FILE__
  abort "usage: brew-preflight.rb TAP_PATH VERSION ASSET_DIRECTORY OUTPUT_PATH" unless ARGV.length == 4
  generate_local_formula(*ARGV)
end
