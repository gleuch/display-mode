require "rubygems"

require "bundler"
Bundler.setup

require "sinatra"
require "instagram"
require "json"


configure do
  APP_ENV = Sinatra::Application.environment.to_s
  APP_ROOT = File.expand_path(File.dirname(__FILE__))
end


use Rack::Session::Cookie

Instagram.configure do |config|
  oauth = YAML::load(File.open("#{APP_ROOT}/oauth.yml"))[APP_ENV]

  config.client_id      = oauth['instagram']['key']
  config.client_secret  = oauth['instagram']['secret']
  CALLBACK_URL          = oauth['instagram']['callback']
end



def has_access_token; !session[:access_token].nil? && session[:access_token] != ''; end

def get_or_post(path, opts={}, &block)
  get(path, opts, &block)
  post(path, opts, &block)
end

def fetch_photos_for_tag(tag)
  client = Instagram.client(:access_token => session[:access_token])
  user = client.user
  photos = {}

  list_photos = Instagram.tag_recent_media(tag)

  unless list_photos.empty? || list_photos['data'].empty?
    list_photos['data'].each do |v|
      photos[v.id] = {:image => v.images.standard_resolution.url, :user => v.user, :caption => (v.caption.nil? || v.caption.text.nil? ? nil : v.caption.text)}
    end
  else
    photos
  end

  photos
end




# INDEX PAGE
get '/' do
  erb :index
end


get_or_post '/auth/instagram' do
  redirect Instagram.authorize_url(:redirect_uri => CALLBACK_URL)
end

# DO OAUTH
get_or_post '/auth/:name/callback' do
  response = Instagram.get_access_token(params[:code], :redirect_uri => CALLBACK_URL)
  session[:access_token] = response.access_token
  redirect '/tag'
end


# FETCH TAG
html_show_tags = lambda {

  # IF ACCESS
  if has_access_token
    # IF TAGNAME
    unless params.nil? || params[:tag].nil? || params[:tag] == ''
      begin
        @photos = fetch_photos_for_tag(params[:tag])
        erb :view_tag
      rescue => err
        puts err.inspect
        erb :error_tag
      end

    # PROMPT TO INPUT TAG
    else
      erb :choose_tag
    end

  # REQUIRE LOGIN
  else
    redirect '/'
  end
}

get_or_post '/tag/:tag', &html_show_tags
get_or_post '/tag', &html_show_tags


json_show_tags = lambda {
  # IF ACCESS
  if has_access_token
    # IF TAGNAME
    unless params.nil? || params[:tag].nil? || params[:tag] == ''
      begin
        @photos = fetch_photos_for_tag(params[:tag])
        {:success => true, :photos => @photos}.to_json
      rescue
        {:error => true, :message => 'Server error.'}.to_json
      end

    # PROMPT TO INPUT TAG
    else
      {:error => true, :select_tag => true, :message => 'No tag specified.'}.to_json
    end

  # REQUIRE LOGIN
  else
    {:error => true, :logout => true, :message => 'Login required'}.to_json
  end
}



get_or_post '/tag/:tag.json', &json_show_tags
get_or_post '/tag.json', &json_show_tags