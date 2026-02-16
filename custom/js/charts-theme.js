/**
 * ECharts 统计图主题切换脚本
 * 适配 Stellar 主题
 */

(function() {
  'use strict';

  window.postsOption = null;
  window.tagsOption = null;
  window.categoriesOption = null;
  window.categoryParentFlag = false;

  function switchPostChart() {
    const color = document.documentElement.getAttribute('data-theme') === 'light' ? '#4c4948' : 'rgba(255,255,255,0.7)';

    if (document.getElementById('posts-chart') && window.postsOption) {
      try {
        const postsOptionNew = window.postsOption;
        postsOptionNew.title.textStyle.color = color;
        postsOptionNew.xAxis.nameTextStyle.color = color;
        postsOptionNew.yAxis.nameTextStyle.color = color;
        postsOptionNew.xAxis.axisLabel.color = color;
        postsOptionNew.yAxis.axisLabel.color = color;
        postsOptionNew.xAxis.axisLine.lineStyle.color = color;
        postsOptionNew.yAxis.axisLine.lineStyle.color = color;
        postsOptionNew.series[0].markLine.data[0].label.color = color;
        window.postsChart.setOption(postsOptionNew);
      } catch (error) {
        console.log(error);
      }
    }

    if (document.getElementById('tags-chart') && window.tagsOption) {
      try {
        const tagsOptionNew = window.tagsOption;
        tagsOptionNew.title.textStyle.color = color;
        tagsOptionNew.xAxis.nameTextStyle.color = color;
        tagsOptionNew.yAxis.nameTextStyle.color = color;
        tagsOptionNew.xAxis.axisLabel.color = color;
        tagsOptionNew.yAxis.axisLabel.color = color;
        tagsOptionNew.xAxis.axisLine.lineStyle.color = color;
        tagsOptionNew.yAxis.axisLine.lineStyle.color = color;
        tagsOptionNew.series[0].markLine.data[0].label.color = color;
        window.tagsChart.setOption(tagsOptionNew);
      } catch (error) {
        console.log(error);
      }
    }

    if (document.getElementById('categories-chart') && window.categoriesOption) {
      try {
        const categoriesOptionNew = window.categoriesOption;
        categoriesOptionNew.title.textStyle.color = color;
        categoriesOptionNew.legend.textStyle.color = color;
        if (!window.categoryParentFlag) {
          categoriesOptionNew.series[0].label.color = color;
        }
        window.categoriesChart.setOption(categoriesOptionNew);
      } catch (error) {
        console.log(error);
      }
    }
  }

  // 监听主题切换
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.attributeName === 'data-theme') {
        setTimeout(switchPostChart, 100);
      }
    });
  });

  const htmlElement = document.documentElement;
  if (htmlElement) {
    observer.observe(htmlElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });
  }

})();
