# Release

Follow these instructions to release a new version of dsvisualizer.

The first step is to increase the version number in the corresponding files.
These are `dsvisualizer/_version.py`, `dsvisualizer/_frontend.py` and
`js/package.json`.

After that you should create a release environment separate from your
development environment.

```bash
cd release
conda deactivate
conda remove --all -y -n releasewidgets

rm -rf dsvisualizer

conda create -c conda-forge --override-channels -y -n releasewidgets notebook \
    nodejs yarn twine jupyterlab=3 jupyter-packaging python-build
conda activate releasewidgets

git clone https://github.com/romero-jose/dsvisualizer.git
cd dsvisualizer
```

Now you can build the extension which will also build the javascript library.

```bash
git clean -dfx
python setup.py sdist
python setup.py bdist_wheel
```

Having built the release you can now release both the JavaScript library and
the Python package

```bash
# Publish js library
pushd js
npm publish
popd

# Publish python package
twine upload dist/*
```
