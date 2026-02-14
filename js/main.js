// Dean Attali / Beautiful Jekyll 2016

var main = {

  bigImgEl : null,
  numImgs : null,
  currentImgIndex : 1,
  cycleTimerId : null,

  init : function() {
    if (!$("#header-big-imgs").length) {
      document.body.classList.add("first-bg-ready");
    }
    // Shorten the navbar after scrolling a little bit down
    $(window).scroll(function() {
        if ($(".navbar").offset().top > 50) {
            $(".navbar").addClass("top-nav-short");
        } else {
            $(".navbar").removeClass("top-nav-short");
        }
    });
    
    // On mobile, hide the avatar when expanding the navbar menu
    $('#main-navbar').on('show.bs.collapse', function () {
      $(".navbar").addClass("top-nav-expanded");
    });
    $('#main-navbar').on('hidden.bs.collapse', function () {
      $(".navbar").removeClass("top-nav-expanded");
    });
	
    // On mobile, when clicking on a multi-level navbar menu, show the child links
    $('#main-navbar').on("click", ".navlinks-parent", function(e) {
      var target = e.target;
      $.each($(".navlinks-parent"), function(key, value) {
        if (value == target) {
          $(value).parent().toggleClass("show-children");
        } else {
          $(value).parent().removeClass("show-children");
        }
      });
    });
    
    // 仅当存在多级导航菜单时计算子菜单宽度（本站无下拉菜单，可跳过）
    var menus = $(".navlinks-container");
    if (menus.length > 0) {
      var navbar = $("#main-navbar ul");
      var fakeMenuHtml = "<li class='fake-menu' style='display:none;'><a></a></li>";
      navbar.append(fakeMenuHtml);
      var fakeMenu = $(".fake-menu");
      $.each(menus, function(i) {
        var children = $(menus[i]).find(".navlinks-children a");
        var words = [];
        $.each(children, function(idx, el) { words = words.concat($(el).text().trim().split(/\s+/)); });
        var maxwidth = 0;
        $.each(words, function(id, word) {
          fakeMenu.html("<a>" + word + "</a>");
          var width = fakeMenu.width();
          if (width > maxwidth) maxwidth = width;
        });
        $(menus[i]).css('min-width', maxwidth + 'px');
      });
      fakeMenu.remove();
    }

    // show the big header image
    main.initImgs();

    main.initHeadingToggle();
    main.initSynopsisToggle();

    // 点击主页 logo 循环：blue -> green -> red -> 循环（阻止链接跳转）
    (function() {
      var logoUrls = ["/logo_blue.png", "/logo_green.png", "/logo_red.png"];
      var img = $(".avatar-container .avatar-img");
      var logoIndex = 0;
      if (img.length && img.attr("src")) {
        var src = (img.attr("src") || "").split("?")[0];
        var names = ["logo_blue.png", "logo_green.png", "logo_red.png"];
        for (var i = 0; i < names.length; i++) {
          if (src.indexOf(names[i]) !== -1) { logoIndex = i; break; }
        }
      }
      $(document).on("click", ".avatar-container a, .avatar-container .avatar-link", function(e) {
        e.preventDefault();
        e.stopPropagation();
        var el = $(".avatar-container .avatar-img");
        if (el.length) {
          logoIndex = (logoIndex + 1) % 3;
          el.attr("src", logoUrls[logoIndex]);
        }
      });
    })();
  },
  
  initImgs : function() {
    if ($("#header-big-imgs").length > 0) {
      main.bigImgEl = $("#header-big-imgs");
      main.numImgs = parseInt(main.bigImgEl.attr("data-num-img"), 10);
      main.currentImgIndex = 1;

      var imgInfo = main.getImgInfo(1);
      main.setImg(imgInfo.src);
      main.updateDots();
      $(".intro-header-first-bg").addClass("loaded");
      document.body.classList.add("first-bg-ready");

      var runFadeThenCleanup = function(img, src, idx, onDone) {
        var done = false;
        var cleanup = function() {
          if (done) return;
          done = true;
          img.off("transitionend");
          requestAnimationFrame(function() {
            main.currentImgIndex = idx;
            main.setImg(src);
            main.updateDots();
            img.remove();
            if (idx === 1) {
              $(".intro-header-first-bg").addClass("loaded");
            } else {
              $(".intro-header-first-bg").removeClass("loaded");
            }
            if (onDone) onDone();
          });
        };
        img.one("transitionend", cleanup);
        setTimeout(cleanup, 1050);
        requestAnimationFrame(function() {
          requestAnimationFrame(function() {
            img.css("opacity", "1");
          });
        });
        /* 首图→第二张：圆点只在 cleanup 时更新（1050ms）。第二张→第三张等：提前在 150ms 点亮，否则会太晚 */
        if (idx !== 2) {
          setTimeout(function() {
            main.currentImgIndex = idx;
            main.updateDots();
          }, 150);
        }
      };

      var getNextImg = function() {
        var nextIdx = (main.currentImgIndex % main.numImgs) + 1;
        var imgInfo = main.getImgInfo(nextIdx);
        var src = imgInfo.src;

        var prefetchImg = new Image();
        prefetchImg.src = src;

        var img = $("<div></div>").addClass("big-img-transition").css("background-image", 'url(' + src + ')');
        $(".intro-header.big-img").prepend(img);
        runFadeThenCleanup(img, src, nextIdx, function() {
          if (main.numImgs > 1) {
            main.cycleTimerId = setTimeout(getNextImg, 6000);
          }
        });
      };

      if (main.numImgs > 1) {
        main.cycleTimerId = setTimeout(getNextImg, 6000);
      }

      var transitionToImg = function(src, idx) {
        var img = $("<div></div>").addClass("big-img-transition").css("background-image", 'url(' + src + ')');
        $(".intro-header.big-img").prepend(img);
        runFadeThenCleanup(img, src, idx);
      };

      $(".header-dot").on("mouseenter click", function() {
        var idx = parseInt($(this).data("index"), 10);
        if (idx === main.currentImgIndex) return;
        if (main.cycleTimerId) {
          clearTimeout(main.cycleTimerId);
          main.cycleTimerId = null;
        }
        var info = main.getImgInfo(idx);
        transitionToImg(info.src, idx);
        if (main.numImgs > 1) {
          main.cycleTimerId = setTimeout(getNextImg, 6000);
        }
      });
    }
  },

  initSynopsisToggle : function() {
    $(".screening-synopsis-block").each(function() {
      var block = $(this);
      var textEl = block.find(".screening-synopsis-text");
      var link = block.find(".screening-synopsis-toggle");
      if (!textEl.length || !link.length) return;
      block.addClass("collapsed");
      if (textEl[0].scrollHeight > textEl[0].clientHeight) {
        link.addClass("visible");
      } else {
        link.removeClass("visible");
        block.removeClass("collapsed");
      }
      link.on("click", function(e) {
        e.preventDefault();
        if (block.hasClass("expanded")) {
          block.removeClass("expanded").addClass("collapsed");
          link.text("更多");
        } else {
          block.removeClass("collapsed").addClass("expanded");
          link.text("收起");
        }
      });
    });
  },

  getImgInfo : function(index) {
    var src = main.bigImgEl.attr("data-img-src-" + index);
    var desc = main.bigImgEl.attr("data-img-desc-" + index);
    return { src: src, desc: desc || "" };
  },

  setImg : function(src) {
    $(".intro-header.big-img").css("background-image", 'url(' + src + ')');
  },

  updateDots : function() {
    $(".header-dot").removeClass("active");
    $(".header-dot[data-index='" + main.currentImgIndex + "']").addClass("active");
  },

  initHeadingToggle : function() {
    var state = 0;
    var $h1 = $(".intro-header.big-img .page-heading h1");
    $(document).on("click", ".intro-header.big-img", function(e) {
      if ($(e.target).closest(".header-dots, .header-dot").length) return;
      state = (state + 1) % 4;
      if (state === 0) {
        $(".intro-header.big-img").removeClass("heading-hidden");
        $h1.text("春风影院");
      } else if (state === 1) {
        $(".intro-header.big-img").addClass("heading-hidden");
      } else if (state === 2) {
        $(".intro-header.big-img").removeClass("heading-hidden");
        $h1.text("春困影院");
      } else {
        $(".intro-header.big-img").addClass("heading-hidden");
      }
    });
  }
};

// 2fc73a3a967e97599c9763d05e564189

document.addEventListener('DOMContentLoaded', main.init);
