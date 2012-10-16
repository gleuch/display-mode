jQuery.noConflict();


if (InstagramDisplayMode === undefined) var InstagramDisplayMode = {};


InstagramDisplayMode.index_at = null;
InstagramDisplayMode.photos = {};
InstagramDisplayMode.photos_index = {};
InstagramDisplayMode.fetch_interval = (1 * 60 * 1000); /* minutes */
InstagramDisplayMode.rotate_interval = (8 * 1000); /* seconds */
InstagramDisplayMode.rotate_timeout = null;
InstagramDisplayMode.tag = '';


InstagramDisplayMode.start = function() {
  jQuery(document).ready(function(){
    InstagramDisplayMode.rotate();
    setTimeout(function() {InstagramDisplayMode.fetch();}, InstagramDisplayMode.fetch_interval);
  });
};


InstagramDisplayMode.fetch = function() {
  jQuery.ajax({
    method : 'GET', data : {tag : InstagramDisplayMode.tag}, url : '/tag.json', dataType : 'json',
    success : function(d,s,x) {
      if (d && d.photos) {
        jQuery.each(d.photos, function(i,v) {
          InstagramDisplayMode.photos[i] = v;
          if (InstagramDisplayMode.photos_index.indexOf(i) == -1) InstagramDisplayMode.photos_index.push(i)
        });

        if (jQuery('#display_board').hasClass('no_photos')) {
          clearTimeout(InstagramDisplayMode.rotate_timeout);
          InstagramDisplayMode.rotate();
        }

      } else {
        if (d.logout) {
          location.href = '/';
        } else if (d.select_tag) {
          location.href = '/tag';
        }
      }
    },
    error : function(x,s,e) { 
      location.href = '/';
    },
    complete : function(e) {
      setTimeout(function() {InstagramDisplayMode.fetch();}, InstagramDisplayMode.fetch_interval);
    }
  });
};


InstagramDisplayMode.rotate = function() {
  if (InstagramDisplayMode.photos_index.length > 0) {
    jQuery('#display_board').removeClass('no_photos').addClass('has_photos');

    var next_index = (InstagramDisplayMode.index_at !== null ? (InstagramDisplayMode.index_at + 1) : 0);
    if (next_index >= InstagramDisplayMode.photos_index.length) next_index = 0;

    try {
      if (InstagramDisplayMode.index_at !== null && InstagramDisplayMode.photos_index[ InstagramDisplayMode.index_at ]) {
        var cur_photo_id = InstagramDisplayMode.photos_index[ InstagramDisplayMode.index_at ];
        jQuery("#display_board_photos div[data-photo-id='"+ cur_photo_id +"']").addClass('hiding');
        setTimeout(function() { jQuery("#display_board_photos div[data-photo-id='"+ cur_photo_id +"']").remove(); }, 1000);
      }
    } catch(e) {
      jQuery('#display_board_photos').html('');
    }

    try {
      var next_photo_id = InstagramDisplayMode.photos_index[ next_index ],
          next_photo = InstagramDisplayMode.photos[ next_photo_id ];
          html = "'<div data-photo-id=\""+ next_photo_id +"\" class=\"loading\"><img src=\""+ next_photo.image +"\" alt=\"\" title=\"\" /></div>";

      jQuery('#display_board_photos').append(html);
      setTimeout(function() { jQuery("#display_board_photos div[data-photo-id='"+ next_photo_id +"']").removeClass('loading'); }, 100);

    } catch(e) {
      // DO ERROR
    }

    InstagramDisplayMode.index_at = next_index;
  } else {
    jQuery('#display_board').removeClass('has_photos').addClass('no_photos');
  }

  InstagramDisplayMode.rotate_timeout = setTimeout(function() {InstagramDisplayMode.rotate();}, InstagramDisplayMode.rotate_interval);
}