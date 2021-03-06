var base_url = "http://epaper.am730.com.hk/Editions/103_2/";

var cur_page = 1;
var cur_size = 1;
var cur_date = new Date();
var end_page = 0;
var loaded_image = [];
var is_fit_screen = false;
var is_no_content = false;

function get_hash_array() {
  return window.location.hash.substring(3).split("/");
}

function get_hash_param() {
  var i;
  var hash_array = get_hash_array();
  var param = {};
  for (i = 0; i < hash_array.length; i += 2) {
    param[hash_array[i]] = hash_array[i + 1];
  }

  return param;
}

function make_hash_from_param(param) {
  var hash = "#!/";
  for (var k in param) {
    hash += k + "/" + param[k] + "/";
  }
  return hash;
}

function preload_page(date, concurrent) {
  var i;

  var do_preload = function (page, s) {
    // console.log("loading page "+page);    
    var url = get_page_url(date, page, s);
    var img = new Image();

    img.addEventListener("load", function () {
      if (loaded_image[page - 1] === undefined) {
        loaded_image[page - 1] = [];
      }

      loaded_image[page - 1][s - 1] = img;
      if ((end_page === 0) || (end_page > 0) && ((page + concurrent) < end_page)) {
        do_preload(page + concurrent, s);
      }
    });

    img.addEventListener("error", function () {
      if ((end_page === 0) || (page < end_page)) {
        end_page = page;
      }

      if (page == 1) {
        is_no_content = true;
        render_message("冇呢一頁 :( ");
      }
    });

    img.src = url;
  };
  for (i = 1; i <= concurrent; i++) {
    for (size = 1; size <= 2; size++) {
      do_preload(i, size);
    }
  }
}

function get_date_array(date) {
  var y = date.getFullYear();
  var m = date.getMonth() + 1;
  var d = date.getDate();

  if (m < 10) {
    m = "0" + m;
  }

  if (d < 10) {
    d = "0" + d;
  }

  return [d, m, y];
}

function get_page_url(date, page, size) {
  var date_array = get_date_array(date);

  if (page < 10) {
    page = "00" + page;
  } else if (page < 100) {
    page = "0" + page;
  }


  var url = base_url + date_array.join("-") + "/Content/";

  if (size == 2) {
    url += "zoom/";
  }

  url += date_array.join("_") + "_" + page + ".jpg";
  return url;
}

function render_page(page, size) {
  var view = document.getElementById("view");
  view.innerHTML = "";
  if (loaded_image[page] !== undefined && loaded_image[page][size] !== undefined) {
    view.appendChild(loaded_image[page - 1][size - 1]);
    loaded_image[page - 1][size - 1].addEventListener("click", next_page);
  } else {
    var img = new Image();
    img.addEventListener("load", function () {
      if (loaded_image[page - 1] === undefined) {
        loaded_image[page - 1] = [];
      }

      loaded_image[page - 1][size - 1] = img;
    });

    img.addEventListener("error", function () {

    });

    if (size == 2 && is_fit_screen) {
      img.style.width = "100%";
    }

    img.src = get_page_url(cur_date, page, size);
    view.appendChild(img);

    img.addEventListener("click", next_page);
  }
}

function update_hash(page, date) {
  var date_array = get_date_array(date);
  date_array.reverse();
  window.location.hash = make_hash_from_param({
    d: date_array.join("-"),
    p: page
  });
}

function render_message(msg) {
  var view = document.getElementById("view");
  view.innerHTML = "<h1>" + msg + "</h1>";
}

function next_page() {
  cur_page++;

  if (end_page > 0 && cur_page >= end_page) {
    cur_page = end_page;
  }
  update_hash(cur_page, cur_date);
}

function prev_page() {
  if (cur_page > 1) {
    cur_page--;
    update_hash(cur_page, cur_date);
  }
}

function zoom_in() {
  if (cur_size == 1) {
    cur_size = 2;
    render_page(cur_page, cur_size);
  }
}

function zoom_out() {
  if (cur_size == 2) {
    cur_size = 1;
    render_page(cur_page, cur_size);
  }
}

function fit_screen() {
  if (is_fit_screen) {
    is_fit_screen = false;
  } else {
    is_fit_screen = true;
  }

  if (cur_size == 2) {
    render_page(cur_page, cur_size);
  }
}

function key_handler(e) {
  switch (e.charCode) {
  case 102:
    fit_screen();
    break;

  case 32: // SPACE BAR
  case 106: // j
    next_page();
    break;

  case 107: // k
    prev_page();
    break;

  case 61: // +
    zoom_in();
    break;

  case 45: // -
    zoom_out();
    break;
  }
}

function hash_change() {
  var param = get_hash_param();
  var prev_date = cur_date;

  if (param.d === undefined) {
    cur_date = new Date();
  } else {
    cur_date = new Date(param.d);
  }

  if (param.p !== undefined) {
    cur_page = parseInt(param.p);
  }


  if (get_date_array(prev_date).join("-") !== get_date_array(cur_date).join("-")) {
    loaded_image = [];
    end_page = 0;
    preload_page(cur_date, 3);
  }

  if (end_page > 0 && cur_page >= end_page) {
    render_message("最後一頁");
  } else {
    render_page(cur_page, cur_size);
  }
  window.scrollTo(0, 0);
}

function main() {
  hash_change();
  preload_page(cur_date, 3);

  document.getElementById("prev_button").addEventListener("click", prev_page);
  document.getElementById("next_button").addEventListener("click", next_page);

  document.getElementById("zoom_in_button").addEventListener("click", zoom_in);
  document.getElementById("zoom_out_button").addEventListener("click", zoom_out);
}

window.addEventListener("keypress", key_handler);
window.addEventListener("load", main);
window.addEventListener("hashchange", hash_change);
