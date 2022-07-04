import itertools
import linecache
from inspect import FrameInfo, stack

from dsvisualizer.operations import (
    LinkedListOperation,
    Metadata,
    Operation,
    Operations,
    VisualizationMetadata,
)
from dsvisualizer.widget import OperationsWidget

_logger = None


def get_logger():
    global _logger
    return _logger


def set_logger(logger: "Logger"):
    global _logger
    _logger = logger


def fmt_stack_entry(frame: FrameInfo, lines_before=2, lines_after=2):
    filename = frame.filename
    lineno = frame.lineno

    lines = linecache.getlines(filename)
    start = max(0, lineno - lines_before - 1)
    stop = min(len(lines), lineno + lines_after)

    digits = len(str(stop))

    formatted_lines = [
        f"{'> ' if n == lineno else '  '}{n:{digits}d} {l}"
        for l, n in zip(
            itertools.islice(lines, start, stop + 1), range(start + 1, stop + 1)
        )
    ]

    return formatted_lines


def get_code(depth=0, lines_before=2, lines_after=2):
    s = stack()
    callee = s[2 + depth]
    formatted = fmt_stack_entry(callee, lines_before, lines_after)
    if s[3 + depth].function == "wrapped":
        caller = s[4 + depth]
        return [caller.code_context[0]] + formatted
    else:
        return formatted


class Logger:
    def __init__(self, logger: "Logger" = None, lines_before=2, lines_after=2):
        self.visualized_upto = 0
        self.lines_before = lines_before
        self.lines_after = lines_after
        if logger:
            self.operations = logger.operations
        else:
            self.operations = Operations()

    def log(self, op: LinkedListOperation):
        self.operations.operations.append(
            Operation(
                operation=op,
                metadata=Metadata(
                    animate=True,
                    source=get_code(1, self.lines_before, self.lines_after),
                ),
            )
        )

    def visualize(
        self, transition_duration=1000, fade_in_duration=1000
    ) -> OperationsWidget:
        """
        Visualizes the logged operations. Only animates the operations that
        haven't been animated yet.
        """
        operations = Operations(
            operations=[
                Operation(
                    operation=o.operation,
                    metadata=Metadata(
                        animate=i >= self.visualized_upto, source=o.metadata.source
                    ),
                )
                for i, o in enumerate(self.operations.operations)
            ],
            metadata=VisualizationMetadata(
                transition_duration=transition_duration,
                fade_in_duration=fade_in_duration,
            ),
        )
        w = OperationsWidget()
        w.operations = operations
        self.visualized_upto = len(self.operations.operations)
        return w

    def copy(self):
        return Logger(self)

    def __enter__(self):
        self._saved_logger = get_logger()
        set_logger(self)
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        set_logger(self._saved_logger)


def reset_logger():
    set_logger(Logger())


_logger = Logger()
