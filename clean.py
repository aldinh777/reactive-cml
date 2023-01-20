import os
import fnmatch


def remove_files(root, patterns, excludes):
    for path, subdirs, files in os.walk(root):
        # Skip the excluded directories
        for exclude in excludes:
            if exclude in subdirs:
                subdirs.remove(exclude)

        for name in files:
            for pattern in patterns:
                if fnmatch.fnmatch(name, pattern):
                    os.remove(os.path.join(path, name))
                    print(f'Removed {name}')


if __name__ == '__main__':
    # Recursively scan files from the current directory
    root = '.'

    # Exclude the node_modules and test directories
    excludes = ['node_modules', 'debug']

    # Remove files with the .js or .d.ts extensions
    patterns = ['*.js', '*.d.ts']
    remove_files(root, patterns, excludes)
