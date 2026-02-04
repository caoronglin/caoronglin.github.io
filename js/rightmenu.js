/**
 * 右键菜单脚本
 * 适配 Stellar 主题
 * 参考：https://meuicat.com/posts/25b0b30e.html
 */

(function() {
  'use strict';

  var selectTextNow = "";
  let rmWidth = 0,
    rmHeight = 0,
    domhref = "",
    domImgSrc = "",
    globalEvent = null,
    rm = {};

  function stopMaskScroll() {
    if (document.getElementById("rightMenu-mask")) {
      document.getElementById("rightMenu-mask").addEventListener("mousewheel", function() {
        rm.hideRightMenu()
      }, false);
    }
    if (document.getElementById("rightMenu")) {
      document.getElementById("rightMenu").addEventListener("mousewheel", function() {
        rm.hideRightMenu()
      }, false);
    }
  }

  function addRightMenuClickEvent() {
    document.getElementById("rightMenu-mask").addEventListener("click", rm.hideRightMenu);
    document.getElementById("rightMenu-mask").addEventListener("contextmenu", function() {
      rm.hideRightMenu();
      return false;
    });

    // 前进后退
    document.getElementById("menu-backward").addEventListener("click", function() {
      window.history.back();
      rm.hideRightMenu();
    });
    document.getElementById("menu-forward").addEventListener("click", function() {
      window.history.forward();
      rm.hideRightMenu();
    });
    document.getElementById("menu-refresh").addEventListener("click", function() {
      rm.hideRightMenu();
      window.location.reload();
    });

    // 复制当前页链接
    document.getElementById("menu-postlink").addEventListener("click", function() {
      rm.copyPostUrl();
    });

    // 复制选中文本
    document.getElementById("menu-copytext").addEventListener("click", function() {
      rm.rightmenuCopyText(selectTextNow);
      rm.showNotification("复制成功，复制和转载请标注本文地址");
    });

    // 粘贴文本
    document.getElementById("menu-pastetext").addEventListener("click", function() {
      rm.pasteText();
    });

    // 引用评论
    document.getElementById("menu-commenttext").addEventListener("click", function() {
      rm.commentText(selectTextNow);
      rm.hideRightMenu();
    });

    // 百度搜索
    document.getElementById("menu-searchBaidu").addEventListener("click", function() {
      rm.searchBaidu();
    });

    // 新窗口打开
    document.getElementById("menu-newwindow").addEventListener("click", function() {
      window.open(domhref);
      rm.hideRightMenu();
    });

    // 复制链接
    document.getElementById("menu-copylink").addEventListener("click", function() {
      rm.copyLink();
    });

    // 复制图片
    document.getElementById("menu-copyimg").addEventListener("click", function() {
      rm.showNotification("图片复制功能需要浏览器权限支持");
      rm.hideRightMenu();
    });

    // 下载图片
    document.getElementById("menu-downloadimg").addEventListener("click", function() {
      rm.downloadImage(domImgSrc, "image");
    });

    // 复制图片链接
    document.getElementById("menu-copylinkimg").addEventListener("click", function() {
      rm.CopyLinkImg(domImgSrc);
    });

    // 随机文章
    document.getElementById("menu-randomPost").addEventListener("click", function() {
      rm.hideRightMenu();
      rm.toRandomPost();
    });
  }

  function selceText() {
    var e;
    if (window.getSelection) {
      e = window.getSelection().toString();
    } else if (document.selection) {
      e = document.selection.createRange().text;
    }
    selectTextNow = e || "";
  }

  window.oncontextmenu = function(e) {
    if (document.body.clientWidth > 768) {
      let n = e.clientX + 10,
        t = e.clientY,
        p = document.querySelector(".rightMenuPost"),
        o = document.querySelector(".rightMenuOther"),
        i = document.querySelector(".rightMenuPlugin"),
        c = document.getElementById("menu-copytext"),
        r = document.getElementById("menu-pastetext"),
        m = document.getElementById("menu-commenttext"),
        d = document.getElementById("menu-search"),
        s = document.getElementById("menu-searchBaidu"),
        a = document.getElementById("menu-newwindow"),
        u = document.getElementById("menu-copylink"),
        l = document.getElementById("menu-copyimg"),
        h = document.getElementById("menu-downloadimg"),
        w = document.getElementById("menu-copylinkimg"),
        y = e.target.href,
        M = e.target.currentSrc,
        b = false;

      o.style.display = "block";
      globalEvent = e;

      if (selectTextNow && window.getSelection()) {
        b = true;
        c.style.display = "block";
        m.style.display = document.getElementById("post-comment") ? "block" : "none";
        d.style.display = "block";
        s.style.display = "block";
        p.style.display = "none";
      } else {
        c.style.display = "none";
        m.style.display = "none";
        d.style.display = "none";
        s.style.display = "none";
      }

      if (y) {
        b = true;
        a.style.display = "block";
        u.style.display = "block";
        domhref = y;
        p.style.display = "none";
      } else {
        a.style.display = "none";
        u.style.display = "none";
      }

      if (M) {
        b = true;
        l.style.display = "block";
        h.style.display = "block";
        w.style.display = "block";
        domImgSrc = M;
        p.style.display = "none";
      } else {
        l.style.display = "none";
        h.style.display = "none";
        w.style.display = "none";
      }

      if (e.target.tagName.toLowerCase() === "input" || e.target.tagName.toLowerCase() === "textarea") {
        b = true;
        r.style.display = "block";
        p.style.display = "none";
      } else {
        r.style.display = "none";
      }

      if (b) {
        o.style.display = "none";
        i.style.display = "block";
      } else {
        i.style.display = "none";
        document.querySelector("#body-wrap.post") ? p.style.display = "block" : p.style.display = "none";
      }

      rm.reloadrmSize();

      if (n + rmWidth > window.innerWidth) {
        n -= rmWidth + 10;
      }

      if (t + rmHeight > window.innerHeight) {
        t -= t + rmHeight - window.innerHeight;
      }

      rm.showRightMenu(true, t, n);
      document.getElementById("rightMenu-mask").style.display = "flex";
      return false;
    }
  };

  document.onmouseup = selceText;

  rm.showRightMenu = function(e, n = 0, t = 0) {
    const rightMenu = document.getElementById("rightMenu");
    rightMenu.style.top = n + "px";
    rightMenu.style.left = t + "px";
    if (e) {
      rightMenu.style.display = "block";
      stopMaskScroll();
    } else {
      rightMenu.style.display = "none";
    }
  };

  rm.hideRightMenu = function() {
    rm.showRightMenu(false);
    document.getElementById("rightMenu-mask").style.display = "none";
  };

  rm.reloadrmSize = function() {
    rmWidth = document.getElementById("rightMenu").offsetWidth;
    rmHeight = document.getElementById("rightMenu").offsetHeight;
  };

  rm.copyPostUrl = function() {
    const url = window.location.href;
    rm.rightmenuCopyText(url);
    rm.showNotification("复制本页链接地址成功");
    rm.hideRightMenu();
  };

  rm.rightmenuCopyText = function(text) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
    rm.hideRightMenu();
  };

  rm.readClipboard = function() {
    if (navigator.clipboard) {
      navigator.clipboard.readText().then(function(text) {
        rm.insertAtCaret(globalEvent.target, text);
      });
    }
  };

  rm.insertAtCaret = function(input, text) {
    const start = input.selectionStart;
    const end = input.selectionEnd;
    if (document.selection) {
      input.focus();
      document.selection.createRange().text = text;
      input.focus();
    } else if (start || start === 0) {
      const scrollTop = input.scrollTop;
      input.value = input.value.substring(0, start) + text + input.value.substring(end, input.value.length);
      input.focus();
      input.selectionStart = start + text.length;
      input.selectionEnd = start + text.length;
      input.scrollTop = scrollTop;
    } else {
      input.value += text;
      input.focus();
    }
  };

  rm.pasteText = function() {
    rm.readClipboard();
    rm.hideRightMenu();
  };

  rm.commentText = function(txt) {
    const inputs = ["#wl-edit", ".el-textarea__inner"];
    for (let i = 0; i < inputs.length; i++) {
      let el = document.querySelector(inputs[i]);
      if (el != null) {
        el.dispatchEvent(new Event('input', {
          bubble: true,
          cancelable: true
        }));
        el.value = '> ' + txt.replace(/\n/g, '\n> ') + '\n\n';
        el.focus();
        el.setSelectionRange(-1, -1);
      }
    }
  };

  rm.searchBaidu = function() {
    rm.showNotification("即将跳转到百度搜索");
    setTimeout(function() {
      window.open("https://www.baidu.com/s?wd=" + selectTextNow);
    }, 1000);
    rm.hideRightMenu();
  };

  rm.copyLink = function() {
    rm.rightmenuCopyText(domhref);
    rm.showNotification("已复制链接地址");
  };

  rm.downloadImage = function(url, name) {
    rm.hideRightMenu();
    rm.showNotification("正在下载中，请稍后");
    setTimeout(function() {
      let img = new Image();
      img.setAttribute("crossOrigin", "anonymous");
      img.onload = function() {
        let canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        let ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, img.width, img.height);
        let dataURL = canvas.toDataURL("image/png");
        let a = document.createElement("a");
        let event = new MouseEvent("click");
        a.download = name || "photo";
        a.href = dataURL;
        a.dispatchEvent(event);
        rm.showNotification("图片已开始下载");
      };
      img.src = url;
    }, 500);
  };

  rm.CopyLinkImg = function(url) {
    rm.rightmenuCopyText(url);
    rm.showNotification("已复制图片链接");
  };

  rm.toRandomPost = function() {
    const posts = document.querySelectorAll('.article-item a');
    if (posts.length > 0) {
      const randomIndex = Math.floor(Math.random() * posts.length);
      posts[randomIndex].click();
    } else {
      rm.showNotification("没有找到文章");
    }
  };

  rm.showNotification = function(message) {
    // Stellar主题可能没有snackbar，使用控制台输出或自定义提示
    console.log(message);
    // 如果需要自定义提示，可以在这里实现
  };

  // 初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      if (document.getElementById('rightMenu')) {
        addRightMenuClickEvent();
        rm.reloadrmSize();
      }
    });
  } else {
    if (document.getElementById('rightMenu')) {
      addRightMenuClickEvent();
      rm.reloadrmSize();
    }
  }

})();
