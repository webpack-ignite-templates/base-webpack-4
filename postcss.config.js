module.exports = {
    plugins: [
        require('autoprefixer'),
        require('postcss-inline-svg')({encode: function(svg){return encodeURIComponent(svg)}, xmlns:false})

    ]
}